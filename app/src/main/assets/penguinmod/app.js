/**
 * PenguinMod Offline Editor Main Controller
 * Ties together the Runtime, Workspace, Sprites Manager, UI Tabs, and Android Native Bridge.
 */

document.addEventListener('DOMContentLoaded', () => {
  const stageCanvas = document.getElementById('stage-canvas');
  const runtime = new PenguinRuntime(stageCanvas);
  const blockEditor = new BlockEditor(runtime);

  // Initialize Default Sprite: Penguin
  const penguinSprite = new Sprite('Penguin');
  runtime.sprites.push(penguinSprite);
  runtime.activeSpriteIndex = 0;

  // App Master Controller
  const app = {
    runtime,
    blockEditor,

    init() {
      this.initTabs();
      this.initTopBar();
      this.initSpritesUI();
      this.initVirtualGamepad();
      this.initCostumesTab();
      this.initSoundsTab();
      this.initFileOps();

      // Initialize Extensions & Projects Gallery
      this.extensionsMgr = new ExtensionsManager(runtime, blockEditor);
      this.galleryMgr = new ProjectsGalleryManager(runtime, blockEditor, this);

      // Load initial default project (Penguin Adventure)
      if (window.PRELOADED_PROJECTS && window.PRELOADED_PROJECTS.platformer) {
        this.galleryMgr.loadProject(window.PRELOADED_PROJECTS.platformer);
      } else {
        this.syncSpritesUI();
      }
    },

    initTabs() {
      const tabButtons = document.querySelectorAll('.tab-item');
      const tabViews = document.querySelectorAll('.tab-view');

      tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          tabButtons.forEach(b => b.classList.remove('active'));
          tabViews.forEach(v => v.classList.remove('active'));

          btn.classList.add('active');
          const tabId = btn.getAttribute('data-tab');
          const targetView = document.getElementById(`tab-${tabId}-view`);
          if (targetView) targetView.classList.add('active');

          if (tabId === 'code') {
            this.blockEditor.loadSpriteScriptsIntoWorkspace(this.runtime.activeSprite);
          }
        });
      });
    },

    initTopBar() {
      const greenFlagBtn = document.getElementById('btn-green-flag');
      const stopBtn = document.getElementById('btn-stop');
      const pauseBtn = document.getElementById('btn-pause');
      const turboBtn = document.getElementById('btn-turbo');
      const fullscreenBtn = document.getElementById('btn-fullscreen-stage');
      const gamepadToggleBtn = document.getElementById('btn-gamepad-toggle');

      greenFlagBtn.addEventListener('click', () => {
        this.runtime.greenFlag();
        if (window.AndroidPenguin && window.AndroidPenguin.vibrateDevice) {
          window.AndroidPenguin.vibrateDevice(30);
        }
      });

      if (pauseBtn) {
        pauseBtn.addEventListener('click', () => {
          const paused = this.runtime.togglePause();
          pauseBtn.classList.toggle('active', paused);
          if (window.AndroidPenguin && window.AndroidPenguin.showToast) {
            window.AndroidPenguin.showToast(paused ? 'Juego en pausa' : 'Juego reanudado');
          }
        });
      }

      stopBtn.addEventListener('click', () => {
        this.runtime.stopAll();
        if (pauseBtn) pauseBtn.classList.remove('active');
      });

      turboBtn.addEventListener('click', () => {
        this.runtime.turboMode = !this.runtime.turboMode;
        turboBtn.classList.toggle('active', this.runtime.turboMode);
        if (window.AndroidPenguin && window.AndroidPenguin.showToast) {
          window.AndroidPenguin.showToast(`Modo Turbo: ${this.runtime.turboMode ? 'Activado' : 'Desactivado'}`);
        }
      });

      // Dropdown toggles
      const setupDropdown = (btnId, menuId) => {
        const btn = document.getElementById(btnId);
        const parent = btn ? btn.parentElement : null;
        if (!btn || !parent) return;

        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          parent.classList.toggle('open');
        });

        window.addEventListener('click', () => {
          parent.classList.remove('open');
        });
      };

      setupDropdown('btn-file-menu', 'file-dropdown');
      setupDropdown('btn-edit-menu', 'edit-dropdown');

      // Stage Fullscreen Toggle
      if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', () => {
          const stagePane = document.getElementById('stage-pane');
          const isFull = stagePane.classList.toggle('fullscreen-mode');
          fullscreenBtn.classList.toggle('active', isFull);
          if (isFull) {
            stagePane.style.position = 'fixed';
            stagePane.style.inset = '48px 0 0 0';
            stagePane.style.width = '100vw';
            stagePane.style.height = 'calc(100vh - 48px)';
            stagePane.style.zIndex = '999';
          } else {
            stagePane.style.position = '';
            stagePane.style.inset = '';
            stagePane.style.width = '';
            stagePane.style.height = '';
            stagePane.style.zIndex = '';
          }
        });
      }

      // Gamepad Visibility Toggle
      if (gamepadToggleBtn) {
        gamepadToggleBtn.addEventListener('click', () => {
          const pad = document.getElementById('virtual-gamepad');
          const isHidden = pad.classList.toggle('hidden');
          gamepadToggleBtn.classList.toggle('active', !isHidden);
        });
      }

      // Workspace buttons
      const clearBtn = document.getElementById('btn-clear-scripts');
      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          if (confirm('¿Deseas limpiar todos los bloques de este objeto?')) {
            this.blockEditor.clearWorkspace();
          }
        });
      }

      const runSelectionBtn = document.getElementById('btn-run-selection');
      if (runSelectionBtn) {
        runSelectionBtn.addEventListener('click', () => {
          this.runtime.greenFlag();
        });
      }
    },

    initVirtualGamepad() {
      const sendKey = (key, isDown) => {
        this.runtime.keys[key] = isDown;
        this.runtime.keys[key.toLowerCase()] = isDown;

        // Custom mobile key mapping for games
        const activeSprite = this.runtime.activeSprite;
        if (isDown && activeSprite) {
          if (key === 'ArrowRight') {
            activeSprite.direction = 90;
            activeSprite.x = Math.min(220, activeSprite.x + 8);
          } else if (key === 'ArrowLeft') {
            activeSprite.direction = 270;
            activeSprite.x = Math.max(-220, activeSprite.x - 8);
          } else if (key === 'ArrowUp') {
            activeSprite.y = Math.min(160, activeSprite.y + 8);
          } else if (key === 'ArrowDown') {
            activeSprite.y = Math.max(-160, activeSprite.y - 8);
          } else if (key === ' ') {
            // Jump button (A)
            activeSprite.vy = 12;
            this.runtime.sound.playPreset('jump');
            if (window.AndroidPenguin && window.AndroidPenguin.vibrateDevice) {
              window.AndroidPenguin.vibrateDevice(20);
            }
          } else if (key === 'x') {
            // Action button (B)
            this.runtime.sound.playPreset('laser');
            if (window.AndroidPenguin && window.AndroidPenguin.vibrateDevice) {
              window.AndroidPenguin.vibrateDevice(25);
            }
          }
        }
      };

      const bindButton = (selector, key) => {
        const btn = document.querySelector(selector);
        if (!btn) return;

        const onDown = (e) => {
          e.preventDefault();
          btn.classList.add('pressed');
          sendKey(key, true);
        };
        const onUp = (e) => {
          e.preventDefault();
          btn.classList.remove('pressed');
          sendKey(key, false);
        };

        btn.addEventListener('mousedown', onDown);
        btn.addEventListener('mouseup', onUp);
        btn.addEventListener('mouseleave', onUp);
        btn.addEventListener('touchstart', onDown, { passive: false });
        btn.addEventListener('touchend', onUp);
        btn.addEventListener('touchcancel', onUp);
      };

      bindButton('.dpad-btn.up', 'ArrowUp');
      bindButton('.dpad-btn.down', 'ArrowDown');
      bindButton('.dpad-btn.left', 'ArrowLeft');
      bindButton('.dpad-btn.right', 'ArrowRight');
      bindButton('.action-btn.btn-a', ' ');
      bindButton('.action-btn.btn-b', 'x');
    },

    initSpritesUI() {
      const addSpriteBtn = document.getElementById('btn-add-sprite');
      if (addSpriteBtn) {
        addSpriteBtn.addEventListener('click', () => {
          const count = this.runtime.sprites.length + 1;
          const newSprite = new Sprite(`Objeto ${count}`);
          newSprite.x = Math.round((Math.random() - 0.5) * 200);
          newSprite.y = Math.round((Math.random() - 0.5) * 150);
          this.runtime.sprites.push(newSprite);
          this.runtime.activeSpriteIndex = this.runtime.sprites.length - 1;
          this.syncSpritesUI();
        });
      }

      // Sprite properties bindings
      const nameInput = document.getElementById('sprite-prop-name');
      const xInput = document.getElementById('sprite-prop-x');
      const yInput = document.getElementById('sprite-prop-y');
      const dirInput = document.getElementById('sprite-prop-dir');
      const sizeInput = document.getElementById('sprite-prop-size');
      const visInput = document.getElementById('sprite-prop-visible');

      const updateActiveSprite = () => {
        const s = this.runtime.activeSprite;
        if (!s) return;
        s.name = nameInput.value;
        s.x = Number(xInput.value) || 0;
        s.y = Number(yInput.value) || 0;
        s.direction = Number(dirInput.value) || 90;
        s.size = Number(sizeInput.value) || 100;
        s.visible = visInput.checked;
        const wsName = document.getElementById('ws-current-sprite-name');
        if (wsName) wsName.textContent = `Sprite: ${s.name}`;
      };

      [nameInput, xInput, yInput, dirInput, sizeInput].forEach(inp => {
        inp.addEventListener('input', updateActiveSprite);
      });
      visInput.addEventListener('change', updateActiveSprite);
    },

    syncSpritesUI() {
      const container = document.getElementById('sprites-list-container');
      if (!container) return;
      container.innerHTML = '';

      const activeSprite = this.runtime.activeSprite;

      this.runtime.sprites.forEach((s, idx) => {
        const card = document.createElement('div');
        card.className = `sprite-card ${idx === this.runtime.activeSpriteIndex ? 'active' : ''}`;

        const costume = s.currentCostume;
        let thumb;
        if (costume && (costume.src || (costume.img && costume.img.src))) {
          thumb = document.createElement('img');
          thumb.className = 'sprite-card-thumb';
          thumb.src = costume.src || costume.img.src;
          thumb.alt = s.name;
        } else {
          thumb = document.createElement('canvas');
          thumb.width = 40;
          thumb.height = 40;
          const ctx = thumb.getContext('2d');
          ctx.translate(20, 20);
          this.runtime.drawDefaultSprite(ctx, s);
        }

        const title = document.createElement('div');
        title.className = 'sprite-card-title';
        title.textContent = s.name;

        card.appendChild(thumb);
        card.appendChild(title);

        card.addEventListener('click', () => {
          this.runtime.activeSpriteIndex = idx;
          this.syncSpritesUI();
          this.renderCostumesList();
          this.blockEditor.loadSpriteScriptsIntoWorkspace(s);
        });

        container.appendChild(card);
      });

      // Update props inputs
      if (activeSprite) {
        document.getElementById('sprite-prop-name').value = activeSprite.name;
        document.getElementById('sprite-prop-x').value = activeSprite.x;
        document.getElementById('sprite-prop-y').value = activeSprite.y;
        document.getElementById('sprite-prop-dir').value = activeSprite.direction;
        document.getElementById('sprite-prop-size').value = activeSprite.size;
        document.getElementById('sprite-prop-visible').checked = activeSprite.visible;

        const wsName = document.getElementById('ws-current-sprite-name');
        if (wsName) wsName.textContent = `Sprite: ${activeSprite.name}`;

        this.blockEditor.loadSpriteScriptsIntoWorkspace(activeSprite);
      }
      this.renderCostumesList();
    },

    renderCostumesList() {
      const listContainer = document.getElementById('costumes-list');
      if (!listContainer) return;
      listContainer.innerHTML = '';

      const activeSprite = this.runtime.activeSprite;
      if (!activeSprite) return;

      activeSprite.costumes.forEach((costume, cIdx) => {
        const item = document.createElement('div');
        item.className = `costume-item ${cIdx === activeSprite.currentCostumeIndex ? 'active' : ''}`;

        let thumb;
        if (costume.src || (costume.img && costume.img.src)) {
          thumb = document.createElement('img');
          thumb.src = costume.src || costume.img.src;
          thumb.style.width = '28px';
          thumb.style.height = '28px';
          thumb.style.objectFit = 'contain';
          thumb.style.borderRadius = '4px';
          thumb.style.background = '#090e14';
        } else {
          thumb = document.createElement('span');
          thumb.textContent = '🎭';
        }

        const title = document.createElement('span');
        title.textContent = costume.name || `Disfraz ${cIdx + 1}`;

        item.appendChild(thumb);
        item.appendChild(title);

        item.addEventListener('click', () => {
          activeSprite.currentCostumeIndex = cIdx;
          this.renderCostumesList();
          this.syncSpritesUI();
        });

        listContainer.appendChild(item);
      });
    },

    initCostumesTab() {
      const canvas = document.getElementById('costume-canvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      let drawing = false;
      let tool = 'brush';

      this.renderCostumesList();

      const addCostumeBtn = document.getElementById('btn-add-costume');
      if (addCostumeBtn) {
        addCostumeBtn.addEventListener('click', () => {
          const activeSprite = this.runtime.activeSprite;
          if (!activeSprite) return;
          const choices = [
            { name: 'Dango Companion', src: 'assets/sprites/dango.svg', rx: 44, ry: 44 },
            { name: 'Penguin Mod', src: 'assets/sprites/penguin.svg', rx: 26, ry: 47 }
          ];
          const chosen = choices[activeSprite.costumes.length % choices.length];
          activeSprite.addCostume(`${chosen.name} (${activeSprite.costumes.length + 1})`, chosen.src, chosen.rx, chosen.ry);
          activeSprite.currentCostumeIndex = activeSprite.costumes.length - 1;
          this.renderCostumesList();
          this.syncSpritesUI();
          if (window.AndroidPenguin && window.AndroidPenguin.showToast) {
            window.AndroidPenguin.showToast(`Disfraz ${chosen.name} añadido`);
          }
        });
      }

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      document.querySelectorAll('.paint-toolbar .tool-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const t = btn.getAttribute('data-tool');
          if (t) {
            document.querySelectorAll('.paint-toolbar .tool-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            tool = t;
          }
        });
      });

      document.getElementById('btn-clear-paint').addEventListener('click', () => {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      });

      const getPos = (e) => {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
          x: (clientX - rect.left) * (canvas.width / rect.width),
          y: (clientY - rect.top) * (canvas.height / rect.height)
        };
      };

      const start = (e) => {
        drawing = true;
        const pos = getPos(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
      };

      const draw = (e) => {
        if (!drawing) return;
        const pos = getPos(e);
        const color = document.getElementById('paint-color').value;
        const size = Number(document.getElementById('paint-size').value);

        ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
        ctx.lineWidth = size;
        ctx.lineCap = 'round';
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      };

      const end = () => { drawing = false; };

      canvas.addEventListener('mousedown', start);
      canvas.addEventListener('mousemove', draw);
      window.addEventListener('mouseup', end);

      canvas.addEventListener('touchstart', start, { passive: false });
      canvas.addEventListener('touchmove', draw, { passive: false });
      window.addEventListener('touchend', end);
    },

    initSoundsTab() {
      const visualizer = document.getElementById('sound-visualizer');
      const chipsContainer = document.getElementById('sound-chips-container');
      const soundTitle = document.getElementById('current-sound-title');
      const playBtn = document.getElementById('btn-play-sound');

      let currentSound = 'jump';
      let currentPitch = 1.0;

      const sounds = [
        { id: 'jump', name: 'Salto Arcade' },
        { id: 'coin', name: 'Moneda / Punto' },
        { id: 'laser', name: 'Disparo Láser' },
        { id: 'hit', name: 'Impacto / Daño' },
        { id: 'explosion', name: 'Explosión Retro' },
        { id: 'win', name: 'Victoria / Nivel' },
        { id: 'pop', name: 'Pop Burbuja' }
      ];

      const drawWave = () => {
        if (!visualizer) return;
        const ctx = visualizer.getContext('2d');
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, visualizer.width, visualizer.height);

        ctx.strokeStyle = '#00c3ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const mid = visualizer.height / 2;
        for (let x = 0; x < visualizer.width; x++) {
          const amp = Math.sin(x * 0.08 * currentPitch) * (visualizer.height * 0.35);
          if (x === 0) ctx.moveTo(x, mid + amp);
          else ctx.lineTo(x, mid + amp);
        }
        ctx.stroke();
      };

      sounds.forEach(snd => {
        const chip = document.createElement('div');
        chip.className = `sound-chip ${snd.id === currentSound ? 'active' : ''}`;
        chip.textContent = snd.name;
        chip.addEventListener('click', () => {
          document.querySelectorAll('.sound-chip').forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
          currentSound = snd.id;
          soundTitle.textContent = `Sonido: ${snd.name}`;
          this.runtime.sound.playPreset(currentSound, currentPitch);
          drawWave();
        });
        chipsContainer.appendChild(chip);
      });

      playBtn.addEventListener('click', () => {
        this.runtime.sound.playPreset(currentSound, currentPitch);
        drawWave();
      });

      document.getElementById('btn-pitch-up').addEventListener('click', () => {
        currentPitch = Math.min(2.5, currentPitch + 0.2);
        this.runtime.sound.playPreset(currentSound, currentPitch);
        drawWave();
      });

      document.getElementById('btn-pitch-down').addEventListener('click', () => {
        currentPitch = Math.max(0.4, currentPitch - 0.2);
        this.runtime.sound.playPreset(currentSound, currentPitch);
        drawWave();
      });

      document.getElementById('btn-sound-echo').addEventListener('click', () => {
        this.runtime.sound.playPreset(currentSound, currentPitch);
        setTimeout(() => this.runtime.sound.playPreset(currentSound, currentPitch * 0.9), 120);
        setTimeout(() => this.runtime.sound.playPreset(currentSound, currentPitch * 0.8), 240);
      });

      drawWave();
    },

    initFileOps() {
      const fileImporter = document.getElementById('file-importer');

      // New Project
      document.getElementById('menu-new-project').addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm('¿Crear un nuevo proyecto vacío?')) {
          this.runtime.stopAll();
          this.runtime.sprites = [new Sprite('Penguin')];
          this.runtime.activeSpriteIndex = 0;
          document.getElementById('project-name').value = 'Proyecto Nuevo';
          this.syncSpritesUI();
        }
      });

      // Save Project (.pmp)
      document.getElementById('menu-save-pmp').addEventListener('click', (e) => {
        e.preventDefault();
        const projectName = document.getElementById('project-name').value.trim() || 'Proyecto_Penguin';
        const projectData = {
          format: 'PenguinMod_PMP_v3',
          title: projectName,
          version: '3.0.0_offline',
          timestamp: Date.now(),
          sprites: this.runtime.sprites.map(s => ({
            name: s.name,
            x: s.x,
            y: s.y,
            direction: s.direction,
            size: s.size,
            visible: s.visible,
            scripts: s.scripts
          }))
        };

        const jsonStr = JSON.stringify(projectData, null, 2);

        // Native Android Bridge
        if (window.AndroidPenguin && window.AndroidPenguin.saveProjectToFile) {
          window.AndroidPenguin.saveProjectToFile(`${projectName}.pmp`, jsonStr);
        } else {
          // Web fallback download
          const blob = new Blob([jsonStr], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${projectName}.pmp`;
          a.click();
          URL.revokeObjectURL(url);
        }
      });

      // Load Project (.pmp)
      document.getElementById('menu-load-pmp').addEventListener('click', (e) => {
        e.preventDefault();
        if (window.AndroidPenguin && window.AndroidPenguin.openFilePicker) {
          window.AndroidPenguin.openFilePicker();
        } else {
          fileImporter.click();
        }
      });

      fileImporter.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
          this.loadProjectFromJSON(evt.target.result);
        };
        reader.readAsText(file);
        fileImporter.value = '';
      });

      // Sample project menu shortcuts
      const setupSampleLink = (linkId, projKey) => {
        const link = document.getElementById(linkId);
        if (link && window.PRELOADED_PROJECTS[projKey]) {
          link.addEventListener('click', (e) => {
            e.preventDefault();
            this.galleryMgr.loadProject(window.PRELOADED_PROJECTS[projKey]);
          });
        }
      };

      setupSampleLink('load-sample-platformer', 'platformer');
      setupSampleLink('load-sample-space', 'space');
      setupSampleLink('load-sample-canvas', 'canvas');
      setupSampleLink('load-sample-clicker', 'clicker');
      setupSampleLink('load-sample-physics', 'physics');
    },

    loadProjectFromJSON(jsonString) {
      try {
        const data = JSON.parse(jsonString);
        this.runtime.stopAll();
        this.runtime.sprites = [];

        (data.sprites || []).forEach(sData => {
          const sprite = new Sprite(sData.name);
          sprite.x = sData.x || 0;
          sprite.y = sData.y || 0;
          sprite.direction = sData.direction !== undefined ? sData.direction : 90;
          sprite.size = sData.size || 100;
          sprite.visible = sData.visible !== false;
          sprite.scripts = sData.scripts || [];
          this.runtime.sprites.push(sprite);
        });

        if (this.runtime.sprites.length === 0) {
          this.runtime.sprites.push(new Sprite('Penguin'));
        }

        this.runtime.activeSpriteIndex = 0;
        this.syncSpritesUI();

        if (data.title) {
          document.getElementById('project-name').value = data.title;
        }

        document.querySelector('.tab-item[data-tab="code"]').click();
        if (window.AndroidPenguin && window.AndroidPenguin.showToast) {
          window.AndroidPenguin.showToast('¡Proyecto importado exitosamente!');
        }
      } catch (err) {
        alert('Error al leer el archivo de proyecto PenguinMod (.pmp / .json).');
      }
    }
  };

  window.penguinApp = app;
  app.init();
});
