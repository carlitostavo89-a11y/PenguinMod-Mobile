/**
 * Preloaded Offline PenguinMod Projects
 * Complete, interactive sample projects demonstrating PenguinMod blocks, sound, physics, and canvas.
 */

const PRELOADED_PROJECTS = {
  platformer: {
    id: 'platformer',
    title: 'Penguin Aventura',
    category: 'Juego',
    description: 'Controla al pingüino con el D-Pad táctil o flechas. Salta, esquiva bordes y recoge puntos con sonido arcade.',
    sprites: [
      {
        name: 'Penguin',
        x: -120,
        y: -100,
        direction: 90,
        size: 100,
        visible: true,
        scripts: [
          {
            hat: { type: 'when_green_flag_clicked' },
            blocks: [
              { opcode: 'set_var', inputs: { var: 'puntos', val: 0 } },
              { opcode: 'set_gravity', inputs: { gravity: 0.8 } },
              { opcode: 'play_sound', inputs: { sound: 'jump' } },
              { opcode: 'say_text', inputs: { text: '¡Usa el D-Pad o flechas!' } },
              { opcode: 'forever_loop', inputs: {} },
              { opcode: 'move_steps', inputs: { steps: 4 } },
              { opcode: 'bounce_edge', inputs: {} }
            ]
          },
          {
            hat: { type: 'when_this_sprite_clicked' },
            blocks: [
              { opcode: 'play_sound', inputs: { sound: 'coin' } },
              { opcode: 'apply_force', inputs: { vx: 0, vy: 14 } },
              { opcode: 'change_var', inputs: { var: 'puntos', val: 10 } },
              { opcode: 'say_text', inputs: { text: '¡Gran salto!' } }
            ]
          }
        ]
      },
      {
        name: 'Estrella Dorada',
        x: 100,
        y: 40,
        direction: 90,
        size: 80,
        visible: true,
        scripts: [
          {
            hat: { type: 'when_green_flag_clicked' },
            blocks: [
              { opcode: 'forever_loop', inputs: {} },
              { opcode: 'turn_right', inputs: { degrees: 8 } }
            ]
          },
          {
            hat: { type: 'when_this_sprite_clicked' },
            blocks: [
              { opcode: 'play_sound', inputs: { sound: 'win' } },
              { opcode: 'change_var', inputs: { var: 'puntos', val: 50 } },
              { opcode: 'change_size', inputs: { change: 10 } }
            ]
          }
        ]
      }
    ]
  },

  space: {
    id: 'space',
    title: 'Space Penguin Shooter',
    category: 'Arcade',
    description: 'Defiende la galaxia de asteroides. Dispara láseres retro con el botón B y muévete por la pantalla.',
    sprites: [
      {
        name: 'Nave Penguin',
        x: 0,
        y: -120,
        direction: 0,
        size: 90,
        visible: true,
        scripts: [
          {
            hat: { type: 'when_green_flag_clicked' },
            blocks: [
              { opcode: 'say_text', inputs: { text: '¡Disparos listos!' } },
              { opcode: 'play_sound', inputs: { sound: 'laser' } },
              { opcode: 'forever_loop', inputs: {} },
              { opcode: 'move_steps', inputs: { steps: 5 } },
              { opcode: 'bounce_edge', inputs: {} }
            ]
          },
          {
            hat: { type: 'when_this_sprite_clicked' },
            blocks: [
              { opcode: 'play_sound', inputs: { sound: 'laser' } },
              { opcode: 'change_var', inputs: { var: 'puntos', val: 5 } }
            ]
          }
        ]
      },
      {
        name: 'Asteroide',
        x: 60,
        y: 100,
        direction: 180,
        size: 75,
        visible: true,
        scripts: [
          {
            hat: { type: 'when_green_flag_clicked' },
            blocks: [
              { opcode: 'forever_loop', inputs: {} },
              { opcode: 'turn_left', inputs: { degrees: 6 } },
              { opcode: 'bounce_edge', inputs: {} }
            ]
          },
          {
            hat: { type: 'when_this_sprite_clicked' },
            blocks: [
              { opcode: 'play_sound', inputs: { sound: 'hit' } },
              { opcode: 'change_var', inputs: { var: 'puntos', val: 20 } },
              { opcode: 'say_text', inputs: { text: '¡BOOM!' } }
            ]
          }
        ]
      }
    ]
  },

  canvas: {
    id: 'canvas',
    title: 'Fuegos Artificiales (Canvas+)',
    category: 'Arte / Demo',
    description: 'Demostración de la extensión Canvas+ de PenguinMod. Traza líneas de arcoíris y figuras geométricas en tiempo real.',
    sprites: [
      {
        name: 'Pincel Penguin',
        x: 0,
        y: 0,
        direction: 45,
        size: 80,
        visible: true,
        scripts: [
          {
            hat: { type: 'when_green_flag_clicked' },
            blocks: [
              { opcode: 'pen_clear', inputs: {} },
              { opcode: 'pen_down', inputs: {} },
              { opcode: 'pen_color', inputs: { color: '#00c3ff' } },
              { opcode: 'play_sound', inputs: { sound: 'win' } },
              { opcode: 'forever_loop', inputs: {} },
              { opcode: 'move_steps', inputs: { steps: 8 } },
              { opcode: 'turn_right', inputs: { degrees: 89 } },
              { opcode: 'bounce_edge', inputs: {} }
            ]
          }
        ]
      }
    ]
  },

  clicker: {
    id: 'clicker',
    title: 'Penguin Clicker Deluxe',
    category: 'Casual',
    description: 'Toca al simpático pingüino para sumar puntos, activar efectos de sonido y ver cómo crece en tamaño.',
    sprites: [
      {
        name: 'Penguin King',
        x: 0,
        y: 0,
        direction: 90,
        size: 110,
        visible: true,
        scripts: [
          {
            hat: { type: 'when_green_flag_clicked' },
            blocks: [
              { opcode: 'set_var', inputs: { var: 'puntos', val: 0 } },
              { opcode: 'set_size', inputs: { size: 100 } },
              { opcode: 'say_text', inputs: { text: '¡Tócame para sumar!' } }
            ]
          },
          {
            hat: { type: 'when_this_sprite_clicked' },
            blocks: [
              { opcode: 'play_sound', inputs: { sound: 'coin' } },
              { opcode: 'change_var', inputs: { var: 'puntos', val: 1 } },
              { opcode: 'change_size', inputs: { change: 5 } },
              { opcode: 'vibrate_device', inputs: { ms: 50 } },
              { opcode: 'say_text', inputs: { text: '+1 Puntos' } }
            ]
          }
        ]
      }
    ]
  },

  physics: {
    id: 'physics',
    title: 'Laboratorio de Física 2D',
    category: 'Simulación',
    description: 'Prueba la gravedad integrada de PenguinMod. Aplica fuerzas hacia arriba con el botón de salto y observa el rebote.',
    sprites: [
      {
        name: 'Bouncy Penguin',
        x: 0,
        y: 120,
        direction: 90,
        size: 100,
        visible: true,
        scripts: [
          {
            hat: { type: 'when_green_flag_clicked' },
            blocks: [
              { opcode: 'set_gravity', inputs: { gravity: 1.0 } },
              { opcode: 'play_sound', inputs: { sound: 'jump' } },
              { opcode: 'forever_loop', inputs: {} },
              { opcode: 'bounce_edge', inputs: {} }
            ]
          },
          {
            hat: { type: 'when_this_sprite_clicked' },
            blocks: [
              { opcode: 'play_sound', inputs: { sound: 'jump' } },
              { opcode: 'apply_force', inputs: { vx: 4, vy: 16 } },
              { opcode: 'say_text', inputs: { text: '¡Impulso!' } }
            ]
          }
        ]
      }
    ]
  }
};

class ProjectsGalleryManager {
  constructor(runtime, blockEditor, app) {
    this.runtime = runtime;
    this.blockEditor = blockEditor;
    this.app = app;
    this.container = document.getElementById('examples-grid-container');
    this.render();
  }

  render() {
    if (!this.container) return;
    this.container.innerHTML = '';

    Object.values(PRELOADED_PROJECTS).forEach(proj => {
      const card = document.createElement('div');
      card.className = 'example-card';

      card.innerHTML = `
        <div class="example-card-header">
          <div class="ext-card-icon">🎮</div>
          <div>
            <div class="ext-card-title">${proj.title}</div>
            <span style="font-size: 11px; color: var(--accent-cyan); font-weight: 700;">${proj.category}</span>
          </div>
        </div>
        <div class="ext-card-desc">${proj.description}</div>
        <div class="ext-card-action">
          <button class="example-load-btn" data-id="${proj.id}">
            ▶ Cargar y Jugar
          </button>
        </div>
      `;

      card.querySelector('.example-load-btn').addEventListener('click', () => {
        this.loadProject(proj);
      });

      this.container.appendChild(card);
    });
  }

  loadProject(proj) {
    this.runtime.stopAll();
    this.runtime.sprites = [];

    proj.sprites.forEach(sData => {
      const sprite = new Sprite(sData.name);
      sprite.x = sData.x;
      sprite.y = sData.y;
      sprite.direction = sData.direction;
      sprite.size = sData.size;
      sprite.visible = sData.visible;
      sprite.scripts = JSON.parse(JSON.stringify(sData.scripts));
      this.runtime.sprites.push(sprite);
    });

    this.runtime.activeSpriteIndex = 0;
    this.app.syncSpritesUI();

    const nameInput = document.getElementById('project-name');
    if (nameInput) nameInput.value = proj.title;

    // Switch to Code tab
    document.querySelector('.tab-item[data-tab="code"]').click();

    // Auto-start project
    setTimeout(() => {
      this.runtime.greenFlag();
      if (window.AndroidPenguin && window.AndroidPenguin.showToast) {
        window.AndroidPenguin.showToast(`Proyecto cargado: ${proj.title}`);
      }
    }, 150);
  }
}

window.PRELOADED_PROJECTS = PRELOADED_PROJECTS;
window.ProjectsGalleryManager = ProjectsGalleryManager;
