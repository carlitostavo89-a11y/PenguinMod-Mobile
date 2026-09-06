/**
 * PenguinMod Offline Extensions Library
 * Allows browsing, enabling, and managing PenguinMod's signature custom extensions offline.
 */

const EXTENSIONS_CATALOG = [
  {
    id: 'canvas',
    name: 'Canvas+ & Lápiz HQ',
    category: 'canvas',
    banner: 'assets/extensions/canvas_banner.png',
    iconImg: 'assets/extensions/canvas_icon.png',
    color: '#0fbd8c',
    description: 'Dibuja en el escenario con trazos suaves, colores hexadecimales, borrado rápido y estampas personalizadas.',
    enabled: true
  },
  {
    id: 'physics',
    name: 'Física 2D Penguin',
    category: 'physics',
    banner: 'assets/extensions/physics_banner.png',
    iconImg: 'assets/extensions/physics_icon.svg',
    color: '#e64a19',
    description: 'Añade gravedad realista, velocidades vectoriales, impulsos y rebotes automáticos contra bordes.',
    enabled: true
  },
  {
    id: 'device',
    name: 'Sensores Móviles & Touch',
    category: 'device',
    banner: 'assets/extensions/cloudlink_banner.png',
    iconImg: 'assets/extensions/gamepad_icon.svg',
    color: '#00c3ff',
    description: 'Soporte completo para pantallas táctiles de Android, vibración háptica, joystick táctil y multitoque.',
    enabled: true
  },
  {
    id: 'mathplus',
    name: 'SharkPool / Matemáticas++',
    category: 'mathplus',
    banner: 'assets/extensions/interfaces_banner.png',
    iconImg: 'assets/extensions/colorutil_icon.svg',
    color: '#00838f',
    description: 'Funciones matemáticas avanzadas: interpolación (lerp), delimitación (clamp), mapeo de rangos y números primos.',
    enabled: true
  },
  {
    id: 'storage',
    name: 'Archivos & Guardado Local',
    category: 'storage',
    banner: 'assets/extensions/storage_banner.png',
    iconImg: 'assets/extensions/files_icon.svg',
    color: '#795548',
    description: 'Guarda partidas, puntuaciones y datos de usuario en la memoria local del dispositivo sin conexión.',
    enabled: true
  },
  {
    id: 'animtext',
    name: 'Texto Animado (Text Extension)',
    category: 'looks',
    banner: 'assets/extensions/text_banner.png',
    iconImg: 'assets/extensions/text_icon.svg',
    color: '#3f51b5',
    description: 'Muestra textos flotantes con tipografías personalizadas y animaciones de arcoíris sobre tus objetos.',
    enabled: true
  },
  {
    id: '3d',
    name: 'Renderizado & Física 3D',
    category: 'canvas',
    banner: 'assets/extensions/3d_banner.png',
    iconImg: 'assets/extensions/3d_icon.png',
    color: '#9c27b0',
    description: 'Motor 3D oficial de PenguinMod para crear mundos y modelos tridimensionales con aceleración por hardware.',
    enabled: false
  },
  {
    id: 'animation',
    name: 'Animación de Sprites & Tweening',
    category: 'motion',
    banner: 'assets/extensions/animation_banner.png',
    iconImg: 'assets/extensions/cursor_icon.svg',
    color: '#ff9800',
    description: 'Interpola posiciones, tamaños y ángulos con curvas Bézier y transiciones cinemáticas fluidas.',
    enabled: false
  },
  {
    id: 'timers',
    name: 'Múltiples Temporizadores',
    category: 'sensing',
    banner: 'assets/extensions/timers_banner.png',
    iconImg: 'assets/extensions/tempvariables_icon.svg',
    color: '#4caf50',
    description: 'Cronómetros independientes ilimitados para controlar enfriamientos de habilidades y récords de tiempo.',
    enabled: false
  },
  {
    id: 'clonemanager',
    name: 'Gestor Avanzado de Clones',
    category: 'control',
    banner: 'assets/extensions/turbowarp_banner.png',
    iconImg: 'assets/extensions/clonemanager.png',
    color: '#ff5722',
    description: 'Elimina el límite de clones tradicional de Scratch y gestiona IDs únicos para cada clon creado.',
    enabled: false
  }
];

class ExtensionsManager {
  constructor(runtime, blockEditor) {
    this.runtime = runtime;
    this.blockEditor = blockEditor;
    this.container = document.getElementById('extensions-grid-container');
    this.render();
  }

  render() {
    if (!this.container) return;
    this.container.innerHTML = '';

    EXTENSIONS_CATALOG.forEach(ext => {
      const card = document.createElement('div');
      card.className = 'ext-card';

      card.innerHTML = `
        ${ext.banner ? `<img src="${ext.banner}" class="ext-card-banner" alt="${ext.name} Banner" />` : ''}
        <div class="ext-card-header">
          <div class="ext-card-icon" style="background: ${ext.color}22; color: ${ext.color};">
            ${ext.iconImg ? `<img src="${ext.iconImg}" alt="" />` : (ext.icon || '🧩')}
          </div>
          <div class="ext-card-title">${ext.name}</div>
        </div>
        <div class="ext-card-desc">${ext.description}</div>
        <div class="ext-card-action">
          <button class="ext-toggle-btn ${ext.enabled ? 'enabled' : ''}" data-id="${ext.id}">
            ${ext.enabled ? '✓ Activada' : '+ Añadir a Proyecto'}
          </button>
        </div>
      `;

      const btn = card.querySelector('.ext-toggle-btn');
      btn.addEventListener('click', () => {
        ext.enabled = !ext.enabled;
        btn.className = `ext-toggle-btn ${ext.enabled ? 'enabled' : ''}`;
        btn.textContent = ext.enabled ? '✓ Activada' : '+ Añadir a Proyecto';
        if (window.AndroidPenguin && window.AndroidPenguin.showToast) {
          window.AndroidPenguin.showToast(`Extensión ${ext.name}: ${ext.enabled ? 'Habilitada' : 'Deshabilitada'}`);
        }
      });

      this.container.appendChild(card);
    });
  }
}

window.ExtensionsManager = ExtensionsManager;
window.EXTENSIONS_CATALOG = EXTENSIONS_CATALOG;
