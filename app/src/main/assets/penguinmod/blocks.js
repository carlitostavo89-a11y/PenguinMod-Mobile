/**
 * PenguinMod Blocks Engine & Palette
 * Defines block categories, block templates, workspace dropzone, and block serialization.
 */

const BLOCK_DEFINITIONS = [
  // MOTION
  {
    category: 'motion',
    opcode: 'move_steps',
    type: 'command',
    label: 'mover {steps} pasos',
    color: '#4C97FF',
    defaults: { steps: 10 }
  },
  {
    category: 'motion',
    opcode: 'turn_right',
    type: 'command',
    label: 'girar ↻ {degrees} grados',
    color: '#4C97FF',
    defaults: { degrees: 15 }
  },
  {
    category: 'motion',
    opcode: 'turn_left',
    type: 'command',
    label: 'girar ↺ {degrees} grados',
    color: '#4C97FF',
    defaults: { degrees: 15 }
  },
  {
    category: 'motion',
    opcode: 'goto_xy',
    type: 'command',
    label: 'ir a x: {x} y: {y}',
    color: '#4C97FF',
    defaults: { x: 0, y: 0 }
  },
  {
    category: 'motion',
    opcode: 'point_direction',
    type: 'command',
    label: 'apuntar en dirección {direction}°',
    color: '#4C97FF',
    defaults: { direction: 90 }
  },
  {
    category: 'motion',
    opcode: 'bounce_edge',
    type: 'command',
    label: 'si toca un borde, rebotar',
    color: '#4C97FF',
    defaults: {}
  },

  // LOOKS
  {
    category: 'looks',
    opcode: 'say_text',
    type: 'command',
    label: 'decir {text}',
    color: '#9966FF',
    defaults: { text: '¡Hola Penguin!' }
  },
  {
    category: 'looks',
    opcode: 'change_size',
    type: 'command',
    label: 'cambiar tamaño por {change}%',
    color: '#9966FF',
    defaults: { change: 10 }
  },
  {
    category: 'looks',
    opcode: 'set_size',
    type: 'command',
    label: 'fijar tamaño al {size}%',
    color: '#9966FF',
    defaults: { size: 100 }
  },
  {
    category: 'looks',
    opcode: 'show',
    type: 'command',
    label: 'mostrar',
    color: '#9966FF',
    defaults: {}
  },
  {
    category: 'looks',
    opcode: 'hide',
    type: 'command',
    label: 'esconder',
    color: '#9966FF',
    defaults: {}
  },

  // SOUND
  {
    category: 'sound',
    opcode: 'play_sound',
    type: 'command',
    label: 'iniciar sonido {sound}',
    color: '#CF63CF',
    defaults: { sound: 'jump' },
    selectOptions: {
      sound: ['jump', 'coin', 'laser', 'hit', 'win', 'pop']
    }
  },

  // EVENTS
  {
    category: 'events',
    opcode: 'when_green_flag_clicked',
    type: 'hat',
    label: 'al presionar ⚑ Bandera Verde',
    color: '#FFBF00',
    defaults: {}
  },
  {
    category: 'events',
    opcode: 'when_this_sprite_clicked',
    type: 'hat',
    label: 'al hacer clic en este objeto',
    color: '#FFBF00',
    defaults: {}
  },

  // CONTROL
  {
    category: 'control',
    opcode: 'wait_seconds',
    type: 'command',
    label: 'esperar {seconds} segundos',
    color: '#FFAB19',
    defaults: { seconds: 1 }
  },
  {
    category: 'control',
    opcode: 'repeat_loop',
    type: 'command',
    label: 'repetir {times} veces',
    color: '#FFAB19',
    defaults: { times: 10 }
  },
  {
    category: 'control',
    opcode: 'forever_loop',
    type: 'command',
    label: 'por siempre',
    color: '#FFAB19',
    defaults: {}
  },

  // VARIABLES
  {
    category: 'variables',
    opcode: 'change_var',
    type: 'command',
    label: 'cambiar {var} por {val}',
    color: '#FF8C1A',
    defaults: { var: 'puntos', val: 1 }
  },
  {
    category: 'variables',
    opcode: 'set_var',
    type: 'command',
    label: 'establecer {var} a {val}',
    color: '#FF8C1A',
    defaults: { var: 'puntos', val: 0 }
  },

  // PENGUINMOD: CANVAS+
  {
    category: 'canvas',
    opcode: 'pen_down',
    type: 'command',
    label: '🖋️ bajar lápiz',
    color: '#0fbd8c',
    defaults: {}
  },
  {
    category: 'canvas',
    opcode: 'pen_up',
    type: 'command',
    label: '🖋️ subir lápiz',
    color: '#0fbd8c',
    defaults: {}
  },
  {
    category: 'canvas',
    opcode: 'pen_clear',
    type: 'command',
    label: '🖋️ borrar todo el dibujo',
    color: '#0fbd8c',
    defaults: {}
  },
  {
    category: 'canvas',
    opcode: 'pen_color',
    type: 'command',
    label: 'fijar color de lápiz a {color}',
    color: '#0fbd8c',
    defaults: { color: '#00c3ff' }
  },

  // PENGUINMOD: PHYSICS 2D
  {
    category: 'physics',
    opcode: 'set_gravity',
    type: 'command',
    label: '⚡ gravedad a {gravity}',
    color: '#e64a19',
    defaults: { gravity: 0.8 }
  },
  {
    category: 'physics',
    opcode: 'apply_force',
    type: 'command',
    label: '⚡ aplicar impulso x: {vx} y: {vy}',
    color: '#e64a19',
    defaults: { vx: 0, vy: 12 }
  },

  // PENGUINMOD: MOBILE & TOUCH
  {
    category: 'device',
    opcode: 'vibrate_device',
    type: 'command',
    label: '📳 vibrar dispositivo {ms} ms',
    color: '#00c3ff',
    defaults: { ms: 100 }
  }
];

class BlockEditor {
  constructor(runtime) {
    this.runtime = runtime;
    this.currentCategory = 'motion';
    this.workspaceDropzone = document.getElementById('blocks-dropzone');
    this.emptyHint = document.getElementById('workspace-empty-hint');
    this.paletteList = document.getElementById('palette-blocks-list');

    this.initCategoryButtons();
    this.renderPalette('motion');
  }

  initCategoryButtons() {
    document.querySelectorAll('.cat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const cat = btn.getAttribute('data-cat');
        this.currentCategory = cat;
        this.renderPalette(cat);
      });
    });
  }

  renderPalette(category) {
    this.paletteList.innerHTML = '';
    const defs = BLOCK_DEFINITIONS.filter(b => b.category === category);

    const titleEl = document.getElementById('palette-title');
    if (titleEl) {
      titleEl.textContent = `Bloques: ${category.toUpperCase()}`;
    }

    defs.forEach(def => {
      const blockEl = this.createBlockElement(def, { ...def.defaults }, false);
      blockEl.addEventListener('click', () => {
        this.addBlockToActiveSprite(def);
      });
      this.paletteList.appendChild(blockEl);
    });
  }

  createBlockElement(def, inputs = {}, isWorkspace = false) {
    const el = document.createElement('div');
    el.className = `scratch-block ${def.type === 'hat' ? 'hat-block' : ''}`;
    el.style.backgroundColor = def.color;
    el.dataset.opcode = def.opcode;

    // Parse template string e.g. "mover {steps} pasos"
    const parts = def.label.split(/(\{.*?\})/);
    parts.forEach(part => {
      if (part.startsWith('{') && part.endsWith('}')) {
        const inputKey = part.slice(1, -1);
        const currentVal = inputs[inputKey] !== undefined ? inputs[inputKey] : (def.defaults[inputKey] || '');

        if (def.selectOptions && def.selectOptions[inputKey]) {
          const select = document.createElement('select');
          select.className = 'block-select';
          def.selectOptions[inputKey].forEach(opt => {
            const optEl = document.createElement('option');
            optEl.value = opt;
            optEl.textContent = opt;
            if (opt === currentVal) optEl.selected = true;
            select.appendChild(optEl);
          });
          select.addEventListener('change', (e) => {
            inputs[inputKey] = e.target.value;
            this.syncWorkspaceToSprite();
          });
          el.appendChild(select);
        } else {
          const input = document.createElement('input');
          input.type = typeof def.defaults[inputKey] === 'number' ? 'number' : 'text';
          input.className = 'block-input';
          input.value = currentVal;
          input.addEventListener('input', (e) => {
            inputs[inputKey] = input.type === 'number' ? Number(e.target.value) : e.target.value;
            this.syncWorkspaceToSprite();
          });
          el.appendChild(input);
        }
      } else if (part) {
        const span = document.createElement('span');
        span.className = 'block-label';
        span.textContent = part;
        el.appendChild(span);
      }
    });

    if (isWorkspace) {
      // Add delete button on hover/tap
      const delBtn = document.createElement('span');
      delBtn.textContent = ' ✕';
      delBtn.style.cursor = 'pointer';
      delBtn.style.opacity = '0.6';
      delBtn.style.marginLeft = '6px';
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        el.remove();
        this.syncWorkspaceToSprite();
      });
      el.appendChild(delBtn);
    }

    el._blockDef = def;
    el._inputs = inputs;
    return el;
  }

  addBlockToActiveSprite(def) {
    const activeSprite = this.runtime.activeSprite;
    if (!activeSprite) return;

    const blockEl = this.createBlockElement(def, { ...def.defaults }, true);
    this.workspaceDropzone.appendChild(blockEl);
    this.syncWorkspaceToSprite();
  }

  syncWorkspaceToSprite() {
    const activeSprite = this.runtime.activeSprite;
    if (!activeSprite) return;

    const blocks = [];
    let hatBlock = null;

    this.workspaceDropzone.querySelectorAll('.scratch-block').forEach(el => {
      const def = el._blockDef;
      if (!def) return;
      if (def.type === 'hat') {
        hatBlock = { type: def.opcode };
      } else {
        blocks.push({
          opcode: def.opcode,
          inputs: { ...el._inputs }
        });
      }
    });

    // Default hat to green flag if none specified
    if (!hatBlock) {
      hatBlock = { type: 'when_green_flag_clicked' };
    }

    activeSprite.scripts = [
      {
        hat: hatBlock,
        blocks: blocks
      }
    ];

    if (this.emptyHint) {
      this.emptyHint.style.display = blocks.length > 0 || hatBlock ? 'none' : 'block';
    }
  }

  loadSpriteScriptsIntoWorkspace(sprite) {
    this.workspaceDropzone.innerHTML = '';
    if (!sprite || !sprite.scripts || sprite.scripts.length === 0) {
      if (this.emptyHint) this.emptyHint.style.display = 'block';
      return;
    }

    if (this.emptyHint) this.emptyHint.style.display = 'none';

    sprite.scripts.forEach(script => {
      if (script.hat) {
        const hatDef = BLOCK_DEFINITIONS.find(b => b.opcode === script.hat.type);
        if (hatDef) {
          const hatEl = this.createBlockElement(hatDef, {}, true);
          this.workspaceDropzone.appendChild(hatEl);
        }
      }

      (script.blocks || []).forEach(blockData => {
        const def = BLOCK_DEFINITIONS.find(b => b.opcode === blockData.opcode);
        if (def) {
          const blockEl = this.createBlockElement(def, { ...blockData.inputs }, true);
          this.workspaceDropzone.appendChild(blockEl);
        }
      });
    });
  }

  clearWorkspace() {
    this.workspaceDropzone.innerHTML = '';
    const activeSprite = this.runtime.activeSprite;
    if (activeSprite) {
      activeSprite.scripts = [];
    }
    if (this.emptyHint) this.emptyHint.style.display = 'block';
  }
}

window.BlockEditor = BlockEditor;
window.BLOCK_DEFINITIONS = BLOCK_DEFINITIONS;
