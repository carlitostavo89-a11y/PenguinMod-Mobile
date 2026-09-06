package com.example

import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.content.pm.ActivityInfo
import android.content.res.Configuration
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.VibrationEffect
import android.os.Vibrator
import android.util.Base64
import android.view.ViewGroup
import android.webkit.JavascriptInterface
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Folder
import androidx.compose.material.icons.filled.Fullscreen
import androidx.compose.material.icons.filled.FullscreenExit
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.SaveAs
import androidx.compose.material.icons.filled.ScreenRotation
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.Badge
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import com.example.data.ProjectEntity
import com.example.ui.theme.MyApplicationTheme
import com.example.ui.theme.PenguinCyan
import com.example.ui.theme.PenguinDarkBg
import com.example.ui.theme.PenguinYellow
import org.json.JSONObject

class MainActivity : ComponentActivity() {
    private val viewModel: MainViewModel by viewModels()
    private var webViewRef: WebView? = null
    private var fileUploadCallback: ValueCallback<Array<Uri>>? = null

    private var isLandscapeState by mutableStateOf(false)
    private var pendingSaveFile: Pair<String, String>? = null // (filename, base64)

    // Save As document creation launcher
    private val createDocumentLauncher = registerForActivityResult(
        ActivityResultContracts.CreateDocument("application/octet-stream")
    ) { uri: Uri? ->
        val fileData = pendingSaveFile
        if (uri != null && fileData != null) {
            try {
                val raw = if (fileData.second.contains(",")) fileData.second.substringAfter(",") else fileData.second
                val bytes = Base64.decode(raw, Base64.DEFAULT)
                contentResolver.openOutputStream(uri)?.use { os ->
                    os.write(bytes)
                    os.flush()
                }
                Toast.makeText(this, "✓ Archivo '${fileData.first}' exportado con éxito", Toast.LENGTH_SHORT).show()
            } catch (e: Exception) {
                Toast.makeText(this, "Error al guardar archivo: ${e.message}", Toast.LENGTH_LONG).show()
            } finally {
                pendingSaveFile = null
            }
        }
    }

    private val filePickerLauncher = registerForActivityResult(
        ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        if (uri != null) {
            try {
                contentResolver.openInputStream(uri)?.use { inputStream ->
                    val bytes = inputStream.readBytes()
                    val base64 = Base64.encodeToString(bytes, Base64.NO_WRAP)
                    val fileName = uri.lastPathSegment?.substringAfterLast('/')?.removeSuffix(".pmp")?.removeSuffix(".sb3") ?: "Proyecto"
                    runOnUiThread {
                        val quoted = JSONObject.quote(base64)
                        val quotedTitle = JSONObject.quote(fileName)
                        webViewRef?.evaluateJavascript(
                            "if(window.penguinApp) window.penguinApp.loadProjectFromData($quoted, $quotedTitle);",
                            null
                        )
                        Toast.makeText(this, "Cargando archivo: $fileName", Toast.LENGTH_SHORT).show()
                    }
                }
            } catch (e: Exception) {
                Toast.makeText(this, "Error al leer archivo: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private val webChromeFileChooserLauncher = registerForActivityResult(
        ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        val results = if (uri != null) arrayOf(uri) else null
        fileUploadCallback?.onReceiveValue(results)
        fileUploadCallback = null
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        isLandscapeState = resources.configuration.orientation == Configuration.ORIENTATION_LANDSCAPE
        requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED
        enableEdgeToEdge()

        setContent {
            MyApplicationTheme(darkTheme = true) {
                val isFullscreen by viewModel.isFullscreen.collectAsState()
                val savedProjects by viewModel.savedProjects.collectAsState()

                val configuration = androidx.compose.ui.platform.LocalConfiguration.current
                val isLandscape = configuration.orientation == Configuration.ORIENTATION_LANDSCAPE

                var showProjectsDialog by remember { mutableStateOf(false) }
                var showAboutDialog by remember { mutableStateOf(false) }
                var pendingSaveDialogData by remember { mutableStateOf<Pair<String, String>?>(null) } // (filename, base64)

                var isOnlineMode by remember { mutableStateOf(false) }

                BackHandler(enabled = webViewRef?.canGoBack() == true) {
                    webViewRef?.goBack()
                }

                Scaffold(
                    modifier = Modifier.fillMaxSize(),
                    topBar = {
                        if (!isFullscreen) {
                            PenguinTopBar(
                                onToggleFullscreen = { viewModel.toggleFullscreen() },
                                onToggleOrientation = { toggleOrientation() },
                                isLandscape = isLandscape,
                                onSaveAs = {
                                    webViewRef?.evaluateJavascript(
                                        "if(window.penguinApp) window.penguinApp.triggerSaveAs();",
                                        null
                                    )
                                },
                                onOpenProjects = { showProjectsDialog = true },
                                onOpenAbout = { showAboutDialog = true },
                                onShare = { shareCurrentProject() },
                                onReload = { webViewRef?.reload() },
                                isOnline = isOnlineMode,
                                onToggleOnline = {
                                    isOnlineMode = !isOnlineMode
                                    if (isOnlineMode) {
                                        webViewRef?.loadUrl("https://studio.penguinmod.com/editor.html")
                                        Toast.makeText(this, "Conectando al editor PenguinMod en línea...", Toast.LENGTH_SHORT).show()
                                    } else {
                                        webViewRef?.loadUrl("file:///android_asset/penguinmod/index.html")
                                        Toast.makeText(this, "Cargando editor local PenguinMod...", Toast.LENGTH_SHORT).show()
                                    }
                                }
                            )
                        }
                    }
                ) { innerPadding ->
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(if (isFullscreen) androidx.compose.foundation.layout.PaddingValues(0.dp) else innerPadding)
                            .background(PenguinDarkBg)
                    ) {
                        PenguinWebView(
                            onWebViewCreated = { webViewRef = it },
                            viewModel = viewModel,
                            onOpenFilePicker = { filePickerLauncher.launch("*/*") },
                            onSaveAsTriggered = { filename, base64 ->
                                pendingSaveDialogData = Pair(filename, base64)
                            },
                            onShowFileChooser = { callback ->
                                fileUploadCallback = callback
                                webChromeFileChooserLauncher.launch("*/*")
                            }
                        )

                        // Floating toggle buttons when in fullscreen
                        if (isFullscreen) {
                            androidx.compose.foundation.layout.Row(
                                modifier = Modifier
                                    .align(Alignment.TopEnd)
                                    .padding(8.dp),
                                horizontalArrangement = androidx.compose.foundation.layout.Arrangement.spacedBy(8.dp)
                            ) {
                                IconButton(
                                    onClick = { toggleOrientation() },
                                    modifier = Modifier
                                        .size(40.dp)
                                        .background(Color(0x88000000), androidx.compose.foundation.shape.CircleShape)
                                        .testTag("fullscreen_rotate_button")
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.ScreenRotation,
                                        contentDescription = "Cambiar orientación",
                                        tint = if (isLandscape) PenguinYellow else Color.White
                                    )
                                }
                                IconButton(
                                    onClick = { viewModel.toggleFullscreen() },
                                    modifier = Modifier
                                        .size(40.dp)
                                        .background(Color(0x88000000), androidx.compose.foundation.shape.CircleShape)
                                        .testTag("exit_fullscreen_fab")
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.FullscreenExit,
                                        contentDescription = "Salir de pantalla completa",
                                        tint = PenguinCyan
                                    )
                                }
                            }
                        }
                    }
                }

                // Save As Dialog: Prompt choice between saving to app (Room) or to file
                pendingSaveDialogData?.let { saveData ->
                    SaveAsDialog(
                        initialTitle = saveData.first,
                        onDismiss = { pendingSaveDialogData = null },
                        onSaveToApp = { chosenTitle ->
                            viewModel.saveProject(chosenTitle, saveData.second)
                            Toast.makeText(this, "✓ Proyecto '$chosenTitle' guardado en la app", Toast.LENGTH_SHORT).show()
                            pendingSaveDialogData = null
                        },
                        onSaveToFile = { chosenTitle ->
                            val filename = if (chosenTitle.endsWith(".pmp")) chosenTitle else "$chosenTitle.pmp"
                            pendingSaveFile = Pair(filename, saveData.second)
                            pendingSaveDialogData = null
                            createDocumentLauncher.launch(filename)
                        }
                    )
                }

                if (showProjectsDialog) {
                    ProjectsDialog(
                        projects = savedProjects,
                        onDismiss = { showProjectsDialog = false },
                        onLoadProject = { project ->
                            showProjectsDialog = false
                            val quoted = JSONObject.quote(project.dataJson)
                            val quotedTitle = JSONObject.quote(project.title)
                            webViewRef?.evaluateJavascript(
                                "if(window.penguinApp) window.penguinApp.loadProjectFromData($quoted, $quotedTitle);",
                                null
                            )
                            Toast.makeText(this, "Cargando: ${project.title}", Toast.LENGTH_SHORT).show()
                        },
                        onExportProject = { project ->
                            val filename = if (project.title.endsWith(".pmp")) project.title else "${project.title}.pmp"
                            pendingSaveFile = Pair(filename, project.dataJson)
                            createDocumentLauncher.launch(filename)
                        },
                        onDeleteProject = { project ->
                            viewModel.deleteProject(project)
                            Toast.makeText(this, "Proyecto eliminado", Toast.LENGTH_SHORT).show()
                        }
                    )
                }

                if (showAboutDialog) {
                    AboutDialog(onDismiss = { showAboutDialog = false })
                }
            }
        }
    }

    override fun onConfigurationChanged(newConfig: Configuration) {
        super.onConfigurationChanged(newConfig)
        isLandscapeState = newConfig.orientation == Configuration.ORIENTATION_LANDSCAPE
    }

    private fun toggleOrientation() {
        val currentIsLandscape = resources.configuration.orientation == Configuration.ORIENTATION_LANDSCAPE
        requestedOrientation = if (currentIsLandscape) {
            ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
        } else {
            ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE
        }
        val msg = if (!currentIsLandscape) "Modo horizontal activado" else "Modo vertical activado"
        Toast.makeText(this, msg, Toast.LENGTH_SHORT).show()
    }

    private fun shareCurrentProject() {
        webViewRef?.evaluateJavascript(
            "(function() { return JSON.stringify({ name: document.getElementById('project-name')?.value || 'Proyecto_Penguin' }); })();"
        ) { result ->
            val sendIntent = Intent().apply {
                action = Intent.ACTION_SEND
                putExtra(Intent.EXTRA_TEXT, "¡Echa un vistazo a mi proyecto de PenguinMod creado 100% offline en Android!")
                type = "text/plain"
            }
            startActivity(Intent.createChooser(sendIntent, "Compartir proyecto PenguinMod"))
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PenguinTopBar(
    onToggleFullscreen: () -> Unit,
    onToggleOrientation: () -> Unit,
    isLandscape: Boolean,
    onSaveAs: () -> Unit,
    onOpenProjects: () -> Unit,
    onOpenAbout: () -> Unit,
    onShare: () -> Unit,
    onReload: () -> Unit,
    isOnline: Boolean,
    onToggleOnline: () -> Unit
) {
    TopAppBar(
        title = {
            androidx.compose.foundation.layout.Row(
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "PenguinMod",
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp,
                    color = Color.White
                )
                androidx.compose.foundation.layout.Spacer(modifier = Modifier.size(8.dp))
                Badge(
                    modifier = Modifier.clickable { onToggleOnline() },
                    containerColor = if (isOnline) Color(0xFF00E676).copy(alpha = 0.2f) else PenguinCyan.copy(alpha = 0.2f),
                    contentColor = if (isOnline) Color(0xFF00E676) else PenguinCyan
                ) {
                    Text(
                        if (isOnline) "ONLINE" else "LOCAL",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.ExtraBold
                    )
                }
            }
        },
        colors = TopAppBarDefaults.topAppBarColors(
            containerColor = Color(0xFF090E14)
        ),
        actions = {
            IconButton(
                onClick = onReload,
                modifier = Modifier.testTag("reload_button")
            ) {
                Icon(
                    imageVector = Icons.Default.Refresh,
                    contentDescription = "Recargar editor",
                    tint = Color.White.copy(alpha = 0.7f)
                )
            }
            IconButton(
                onClick = onSaveAs,
                modifier = Modifier.testTag("save_as_button")
            ) {
                Icon(
                    imageVector = Icons.Default.SaveAs,
                    contentDescription = "Guardar como...",
                    tint = PenguinCyan
                )
            }
            IconButton(
                onClick = onToggleOrientation,
                modifier = Modifier.testTag("toggle_orientation_button")
            ) {
                Icon(
                    imageVector = Icons.Default.ScreenRotation,
                    contentDescription = if (isLandscape) "Cambiar a vertical" else "Cambiar a horizontal",
                    tint = if (isLandscape) PenguinYellow else Color.White.copy(alpha = 0.8f)
                )
            }
            IconButton(
                onClick = onOpenProjects,
                modifier = Modifier.testTag("open_projects_button")
            ) {
                Icon(
                    imageVector = Icons.Default.Folder,
                    contentDescription = "Proyectos guardados",
                    tint = Color.White.copy(alpha = 0.7f)
                )
            }
            IconButton(
                onClick = onToggleFullscreen,
                modifier = Modifier.testTag("toggle_fullscreen_button")
            ) {
                Icon(
                    imageVector = Icons.Default.Fullscreen,
                    contentDescription = "Pantalla completa",
                    tint = Color.White.copy(alpha = 0.7f)
                )
            }
            IconButton(
                onClick = onShare,
                modifier = Modifier.testTag("share_project_button")
            ) {
                Icon(
                    imageVector = Icons.Default.Share,
                    contentDescription = "Compartir",
                    tint = Color.White.copy(alpha = 0.7f)
                )
            }
            IconButton(
                onClick = onOpenAbout,
                modifier = Modifier.testTag("open_about_button")
            ) {
                Icon(
                    imageVector = Icons.Default.Info,
                    contentDescription = "Información",
                    tint = Color.White.copy(alpha = 0.7f)
                )
            }
        }
    )
}

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun PenguinWebView(
    onWebViewCreated: (WebView) -> Unit,
    viewModel: MainViewModel,
    onOpenFilePicker: () -> Unit,
    onSaveAsTriggered: (filename: String, base64: String) -> Unit,
    onShowFileChooser: (ValueCallback<Array<Uri>>) -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current

    AndroidView(
        modifier = modifier.fillMaxSize(),
        factory = { ctx ->
            WebView(ctx).apply {
                layoutParams = ViewGroup.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
                )

                isVerticalScrollBarEnabled = true
                isHorizontalScrollBarEnabled = true
                isScrollbarFadingEnabled = true

                settings.apply {
                    javaScriptEnabled = true
                    domStorageEnabled = true
                    databaseEnabled = true
                    allowFileAccess = true
                    allowContentAccess = true
                    allowFileAccessFromFileURLs = true
                    allowUniversalAccessFromFileURLs = true
                    useWideViewPort = true
                    loadWithOverviewMode = true
                    cacheMode = WebSettings.LOAD_DEFAULT
                    mediaPlaybackRequiresUserGesture = false
                    setSupportZoom(true)
                    builtInZoomControls = true
                    displayZoomControls = false
                    mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                }

                addJavascriptInterface(
                    AndroidPenguinBridge(
                        context = ctx,
                        viewModel = viewModel,
                        onOpenFilePicker = onOpenFilePicker,
                        onSaveAsTriggered = onSaveAsTriggered
                    ),
                    "AndroidPenguin"
                )

                webChromeClient = object : WebChromeClient() {
                    override fun onShowFileChooser(
                        webView: WebView?,
                        filePathCallback: ValueCallback<Array<Uri>>?,
                        fileChooserParams: FileChooserParams?
                    ): Boolean {
                        if (filePathCallback != null) {
                            onShowFileChooser(filePathCallback)
                            return true
                        }
                        return false
                    }

                    override fun onPermissionRequest(request: android.webkit.PermissionRequest?) {
                        request?.grant(request.resources)
                    }
                }

                webViewClient = object : WebViewClient() {
                    override fun shouldInterceptRequest(
                        view: WebView?,
                        request: WebResourceRequest?
                    ): WebResourceResponse? {
                        val url = request?.url ?: return null
                        val urlStr = url.toString()

                        if (urlStr.startsWith("file:///android_asset/")) {
                            val assetPath = urlStr.removePrefix("file:///android_asset/")
                            try {
                                val stream = ctx.assets.open(assetPath)
                                val mimeType = getMimeType(assetPath)
                                return WebResourceResponse(mimeType, "UTF-8", stream)
                            } catch (e: Exception) {
                                return createFallbackResponse(assetPath)
                            }
                        }

                        if (urlStr.contains("studio.penguinmod.com") || urlStr.contains("penguinmod.github.io")) {
                            val path = url.path?.removePrefix("/") ?: ""
                            val localAssetPath = "penguinmod/$path"
                            try {
                                val stream = ctx.assets.open(localAssetPath)
                                val mimeType = getMimeType(localAssetPath)
                                return WebResourceResponse(mimeType, "UTF-8", stream)
                            } catch (e: Exception) {
                                return null
                            }
                        }

                        return super.shouldInterceptRequest(view, request)
                    }

                    override fun shouldOverrideUrlLoading(
                        view: WebView?,
                        request: WebResourceRequest?
                    ): Boolean {
                        val url = request?.url?.toString() ?: ""
                        if (url.startsWith("file:") ||
                            url.contains("penguinmod") ||
                            url.contains("scratch") ||
                            url.contains("turbowarp")
                        ) {
                            return false
                        }
                        return try {
                            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                            ctx.startActivity(intent)
                            true
                        } catch (e: Exception) {
                            false
                        }
                    }

                    override fun onReceivedError(
                        view: WebView?,
                        errorCode: Int,
                        description: String?,
                        failingUrl: String?
                    ) {
                        super.onReceivedError(view, errorCode, description, failingUrl)
                        if (failingUrl?.startsWith("http") == true) {
                            // Fallback to local official editor if online fails
                            view?.loadUrl("file:///android_asset/penguinmod/index.html")
                        }
                    }
                }

                loadUrl("file:///android_asset/penguinmod/index.html")
                onWebViewCreated(this)
            }
        }
    )
}

class AndroidPenguinBridge(
    private val context: Context,
    private val viewModel: MainViewModel,
    private val onOpenFilePicker: () -> Unit,
    private val onSaveAsTriggered: (filename: String, base64: String) -> Unit
) {
    private val vibrator = context.getSystemService(Vibrator::class.java)

    @JavascriptInterface
    fun onSaveAsTriggered(filename: String, base64: String) {
        onSaveAsTriggered.invoke(filename, base64)
    }

    @JavascriptInterface
    fun saveProjectToFile(title: String, jsonContent: String) {
        onSaveAsTriggered.invoke(title, jsonContent)
    }

    @JavascriptInterface
    fun openFilePicker() {
        onOpenFilePicker()
    }

    @JavascriptInterface
    fun vibrateDevice(ms: Long) {
        val duration = ms.coerceIn(10L, 500L)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator?.vibrate(VibrationEffect.createOneShot(duration, VibrationEffect.DEFAULT_AMPLITUDE))
        } else {
            @Suppress("DEPRECATION")
            vibrator?.vibrate(duration)
        }
    }

    @JavascriptInterface
    fun showToast(message: String) {
        Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
    }
}

private fun getMimeType(path: String): String {
    val lower = path.lowercase()
    return when {
        lower.endsWith(".html") || lower.endsWith(".htm") -> "text/html"
        lower.endsWith(".js") || lower.endsWith(".mjs") -> "application/javascript"
        lower.endsWith(".css") -> "text/css"
        lower.endsWith(".json") || lower.endsWith(".webmanifest") -> "application/json"
        lower.endsWith(".svg") -> "image/svg+xml"
        lower.endsWith(".png") -> "image/png"
        lower.endsWith(".jpg") || lower.endsWith(".jpeg") -> "image/jpeg"
        lower.endsWith(".gif") -> "image/gif"
        lower.endsWith(".webp") -> "image/webp"
        lower.endsWith(".mp3") -> "audio/mpeg"
        lower.endsWith(".wav") -> "audio/wav"
        lower.endsWith(".ogg") -> "audio/ogg"
        lower.endsWith(".woff2") -> "font/woff2"
        lower.endsWith(".woff") -> "font/woff"
        lower.endsWith(".ttf") -> "font/ttf"
        lower.endsWith(".wasm") -> "application/wasm"
        else -> "application/octet-stream"
    }
}

private fun createFallbackResponse(path: String): WebResourceResponse {
    val lower = path.lowercase()
    return when {
        lower.endsWith(".svg") -> {
            val emptySvg = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\"></svg>"
            WebResourceResponse("image/svg+xml", "UTF-8", java.io.ByteArrayInputStream(emptySvg.toByteArray(Charsets.UTF_8)))
        }
        lower.endsWith(".png") -> {
            val transparentPng = android.util.Base64.decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", android.util.Base64.DEFAULT)
            WebResourceResponse("image/png", null, java.io.ByteArrayInputStream(transparentPng))
        }
        lower.endsWith(".js") -> {
            WebResourceResponse("application/javascript", "UTF-8", java.io.ByteArrayInputStream("/* fallback empty */".toByteArray(Charsets.UTF_8)))
        }
        lower.endsWith(".mp3") || lower.endsWith(".wav") || lower.endsWith(".ogg") -> {
            WebResourceResponse("audio/mpeg", null, java.io.ByteArrayInputStream(ByteArray(0)))
        }
        else -> {
            WebResourceResponse("application/octet-stream", null, java.io.ByteArrayInputStream(ByteArray(0)))
        }
    }
}

