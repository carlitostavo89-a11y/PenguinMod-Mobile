/**
 * PenguinMod Offline Runtime & VM
 * Provides 60 FPS stage rendering, Scratch coordinate system (-240..240, -180..180),
 * sprite transformations, audio synthesizer, canvas/pen layer, and sensing input.
 */

class PenguinSoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playPreset(type, pitch = 1.0) {
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    switch (type) {
      case 'jump':
        osc.type = 'square';
        osc.frequency.setValueAtTime(150 * pitch, t);
        osc.frequency.exponentialRampToValueAtTime(500 * pitch, t + 0.15);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.linearRampToValueAtTime(0.01, t + 0.15);
        osc.start(t);
        osc.stop(t + 0.15);
        break;

      case 'coin':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(987 * pitch, t);
        osc.frequency.setValueAtTime(1318 * pitch, t + 0.08);
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.linearRampToValueAtTime(0.01, t + 0.3);
        osc.start(t);
        osc.stop(t + 0.3);
        break;

      case 'laser':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800 * pitch, t);
        osc.frequency.exponentialRampToValueAtTime(80 * pitch, t + 0.18);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.linearRampToValueAtTime(0.01, t + 0.18);
        osc.start(t);
        osc.stop(t + 0.18);
        break;

      case 'hit':
      case 'explosion':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120 * pitch, t);
        osc.frequency.linearRampToValueAtTime(30 * pitch, t + 0.25);
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.linearRampToValueAtTime(0.01, t + 0.25);
        osc.start(t);
        osc.stop(t + 0.25);
        break;

      case 'win':
        // Arpeggio
        [523, 659, 783, 1046].forEach((freq, idx) => {
          const o = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          o.type = 'triangle';
          o.connect(g);
          g.connect(this.ctx.destination);
          const st = t + idx * 0.1;
          o.frequency.setValueAtTime(freq * pitch, st);
          g.gain.setValueAtTime(0.2, st);
          g.gain.linearRampToValueAtTime(0.01, st + 0.2);
          o.start(st);
          o.stop(st + 0.25);
        });
        break;

      case 'pop':
      default:
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400 * pitch, t);
        osc.frequency.exponentialRampToValueAtTime(80 * pitch, t + 0.06);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.linearRampToValueAtTime(0.01, t + 0.06);
        osc.start(t);
        osc.stop(t + 0.06);
        break;
    }
  }
}

class Sprite {
  constructor(name, costumeSvg = null) {
    this.name = name;
    this.x = 0; // Scratch coords: -240 to 240
    this.y = 0; // Scratch coords: -180 to 180
    this.direction = 90; // 90 = right, 0 = up
    this.size = 100; // Percentage
    this.visible = true;
    this.sayText = '';
    this.sayTimer = 0;

    // Physics & Pen properties
    this.vx = 0;
    this.vy = 0;
    this.gravity = 0;
    this.penDown = false;
    this.penColor = '#00c3ff';
    this.penSize = 3;

    // Costumes list
    this.costumes = [];
    this.currentCostumeIndex = 0;

    // Scripts array (list of blocks chains)
    this.scripts = [];

    if (costumeSvg) {
      this.addCostume('Disfraz 1', costumeSvg);
    } else if (name.toLowerCase().includes('penguin')) {
      this.addCostume('Penguin Official', 'assets/sprites/penguin.svg', 26, 47);
      this.addCostume('Dango Companion', 'assets/sprites/dango.svg', 44, 44);
    } else if (name.toLowerCase().includes('dango')) {
      this.addCostume('Dango Official', 'assets/sprites/dango.svg', 44, 44);
    } else {
      this.addCostume('Disfraz 1', null);
    }
  }

  addCostume(name, svgDataOrUrl, rotationCenterX = null, rotationCenterY = null) {
    let img = null;
    if (svgDataOrUrl) {
      img = new Image();
      img.src = svgDataOrUrl;
    }
    this.costumes.push({
      name,
      img,
      src: svgDataOrUrl,
      rotationCenterX,
      rotationCenterY
    });
  }

  get currentCostume() {
    return this.costumes[this.currentCostumeIndex] || null;
  }
}

class PenguinRuntime {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = 480;
    this.height = 360;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    // Pen overlay canvas
    this.penCanvas = document.createElement('canvas');
    this.penCanvas.width = this.width;
    this.penCanvas.height = this.height;
    this.penCtx = this.penCanvas.getContext('2d');

    this.sound = new PenguinSoundEngine();

    // Sprites & Execution state
    this.sprites = [];
    this.activeSpriteIndex = 0;
    this.isRunning = false;
    this.isPaused = false;
    this.turboMode = false;
    this.targetFps = 60;
    this.fps = 60;
    this.lastFrameTime = performance.now();
    this.frameCount = 0;
    this.fpsTimer = performance.now();

    // Input state
    this.keys = {};
    this.mouse = { x: 0, y: 0, isDown: false };
    this.touches = [];
    this.variables = { puntos: 0, score: 0, vidas: 3 };
    this.lists = {};

    // Threads running in VM
    this.threads = [];

    this.initInputs();
    this.startLoop();
  }

  get activeSprite() {
    return this.sprites[this.activeSpriteIndex] || null;
  }

  initInputs() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key] = true;
      this.keys[e.key.toLowerCase()] = true;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key] = false;
      this.keys[e.key.toLowerCase()] = false;
    });

    const updateMouse = (clientX, clientY) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.width / rect.width;
      const scaleY = this.height / rect.height;
      const rawX = (clientX - rect.left) * scaleX;
      const rawY = (clientY - rect.top) * scaleY;
      // Convert to Scratch coords: (0,0) is center
      this.mouse.x = Math.round(rawX - this.width / 2);
      this.mouse.y = Math.round(this.height / 2 - rawY);
    };

    this.canvas.addEventListener('mousedown', (e) => {
      this.mouse.isDown = true;
      updateMouse(e.clientX, e.clientY);
      this.checkSpriteClick(this.mouse.x, this.mouse.y);
      this.sound.init();
    });

    window.addEventListener('mousemove', (e) => {
      updateMouse(e.clientX, e.clientY);
    });

    window.addEventListener('mouseup', () => {
      this.mouse.isDown = false;
    });

    // Touch events for mobile
    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        this.mouse.isDown = true;
        updateMouse(e.touches[0].clientX, e.touches[0].clientY);
        this.checkSpriteClick(this.mouse.x, this.mouse.y);
        this.sound.init();
      }
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        updateMouse(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    this.canvas.addEventListener('touchend', () => {
      this.mouse.isDown = false;
    });
  }

  // Scratch coordinates to Canvas coordinates
  toCanvasX(scratchX) {
    return scratchX + this.width / 2;
  }

  toCanvasY(scratchY) {
    return this.height / 2 - scratchY;
  }

  startLoop() {
    const loop = (now) => {
      const delta = now - this.lastFrameTime;
      this.lastFrameTime = now;

      // Calculate real FPS
      this.frameCount++;
      if (now - this.fpsTimer >= 500) {
        this.fps = Math.round((this.frameCount * 1000) / (now - this.fpsTimer));
        this.frameCount = 0;
        this.fpsTimer = now;
        const counterEl = document.getElementById('fps-counter');
        if (counterEl) counterEl.textContent = `${this.fps} FPS`;
      }

      if (this.isRunning && !this.isPaused) {
        this.stepSimulation();
      }

      this.render();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  stepSimulation() {
    // Step all active threads
    const maxSteps = this.turboMode ? 50 : 1;
    for (let step = 0; step < maxSteps; step++) {
      for (let i = this.threads.length - 1; i >= 0; i--) {
        const thread = this.threads[i];
        if (!thread.isDone) {
          thread.step();
        } else {
          this.threads.splice(i, 1);
        }
      }
    }

    // Physics step
    this.sprites.forEach(sprite => {
      if (sprite.gravity !== 0) {
        sprite.vy -= sprite.gravity;
        sprite.y += sprite.vy;
        sprite.x += sprite.vx;

        // Ground collision (-140)
        if (sprite.y < -130) {
          sprite.y = -130;
          sprite.vy = 0;
        }
        // Left/right bounds
        if (sprite.x > 220) { sprite.x = 220; sprite.vx = -sprite.vx * 0.7; }
        if (sprite.x < -220) { sprite.x = -220; sprite.vx = -sprite.vx * 0.7; }
      }
    });
  }

  render() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Render background
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Draw pen layer
    this.ctx.drawImage(this.penCanvas, 0, 0);

    // Draw sprites back-to-front
    this.sprites.forEach(sprite => {
      if (!sprite.visible) return;

      const cx = this.toCanvasX(sprite.x);
      const cy = this.toCanvasY(sprite.y);

      this.ctx.save();
      this.ctx.translate(cx, cy);
      // Direction in Scratch: 90 is right, 0 is up -> convert to rad
      const angleRad = ((sprite.direction - 90) * Math.PI) / 180;
      this.ctx.rotate(angleRad);
      const scale = (sprite.size / 100);
      this.ctx.scale(scale, scale);

      const costume = sprite.currentCostume;
      if (costume && costume.img && costume.img.complete && costume.img.naturalWidth > 0) {
        const w = costume.img.naturalWidth || 60;
        const h = costume.img.naturalHeight || 60;
        const ox = costume.rotationCenterX != null ? costume.rotationCenterX : (w / 2);
        const oy = costume.rotationCenterY != null ? costume.rotationCenterY : (h / 2);
        this.ctx.drawImage(costume.img, -ox, -oy, w, h);
      } else {
        // Fallback procedural draw (Cute Penguin or Circle)
        this.drawDefaultSprite(this.ctx, sprite);
      }

      this.ctx.restore();

      // Draw Speech Bubble if active
      if (sprite.sayText) {
        this.drawSpeechBubble(cx, cy, sprite.sayText);
      }
    });
  }

  drawDefaultSprite(ctx, sprite) {
    if (sprite.name.toLowerCase().includes('penguin')) {
      // Draw Penguin
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.ellipse(0, 0, 24, 30, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(0, 6, 17, 21, 0, 0, Math.PI * 2);
      ctx.fill();

      // Eyes
      ctx.fillStyle = '#111';
      ctx.beginPath();
      ctx.arc(-7, -8, 3.5, 0, Math.PI * 2);
      ctx.arc(7, -8, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Beak
      ctx.fillStyle = '#ffb703';
      ctx.beginPath();
      ctx.moveTo(-6, -2);
      ctx.lineTo(6, -2);
      ctx.lineTo(0, 7);
      ctx.closePath();
      ctx.fill();

      // Scarf / Cyan badge
      ctx.fillStyle = '#00c3ff';
      ctx.fillRect(-14, -2, 28, 5);
    } else {
      ctx.fillStyle = '#ff4757';
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawSpeechBubble(cx, cy, text) {
    const bubbleX = Math.min(Math.max(cx, 80), this.width - 80);
    const bubbleY = Math.max(cy - 45, 30);

    this.ctx.save();
    this.ctx.font = 'bold 12px sans-serif';
    const textWidth = this.ctx.measureText(text).width;
    const padding = 8;
    const boxW = textWidth + padding * 2;
    const boxH = 24;

    this.ctx.fillStyle = '#ffffff';
    this.ctx.strokeStyle = '#263342';
    this.ctx.lineWidth = 2;

    this.ctx.beginPath();
    this.ctx.roundRect(bubbleX - boxW / 2, bubbleY - boxH, boxW, boxH, 8);
    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.fillStyle = '#111827';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(text, bubbleX, bubbleY - boxH / 2);
    this.ctx.restore();
  }

  checkSpriteClick(clickX, clickY) {
    for (let i = this.sprites.length - 1; i >= 0; i--) {
      const s = this.sprites[i];
      const dist = Math.hypot(s.x - clickX, s.y - clickY);
      if (dist < 35 * (s.size / 100)) {
        this.triggerHats('when_this_sprite_clicked', s);
        break;
      }
    }
  }

  triggerHats(hatType, targetSprite = null) {
    const targetSprites = targetSprite ? [targetSprite] : this.sprites;
    targetSprites.forEach(sprite => {
      sprite.scripts.forEach(script => {
        if (script.hat && script.hat.type === hatType) {
          this.launchThread(sprite, script);
        }
      });
    });
  }

  launchThread(sprite, script) {
    const thread = new Thread(this, sprite, script);
    this.threads.push(thread);
  }

  greenFlag() {
    this.isRunning = true;
    this.threads = [];
    this.sound.init();
    this.triggerHats('when_green_flag_clicked');
  }

  stopAll() {
    this.isRunning = false;
    this.threads = [];
    this.sprites.forEach(s => {
      s.sayText = '';
      s.vx = 0;
      s.vy = 0;
    });
    // Remove glow effect on UI blocks
    document.querySelectorAll('.scratch-block.executing').forEach(el => {
      el.classList.remove('executing');
    });
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    return this.isPaused;
  }

  clearPen() {
    this.penCtx.clearRect(0, 0, this.width, this.height);
  }

  drawPenLine(x1, y1, x2, y2, color, size) {
    this.penCtx.strokeStyle = color;
    this.penCtx.lineWidth = size;
    this.penCtx.lineCap = 'round';
    this.penCtx.beginPath();
    this.penCtx.moveTo(this.toCanvasX(x1), this.toCanvasY(y1));
    this.penCtx.lineTo(this.toCanvasX(x2), this.toCanvasY(y2));
    this.penCtx.stroke();
  }
}

/**
 * Execution Thread for block sequences
 */
class Thread {
  constructor(runtime, sprite, script) {
    this.runtime = runtime;
    this.sprite = sprite;
    this.script = script;
    this.pc = 0; // Program counter
    this.stack = [];
    this.isDone = false;
    this.waitTimer = 0;
  }

  step() {
    if (this.isDone || !this.runtime.isRunning) {
      this.isDone = true;
      return;
    }

    if (this.waitTimer > 0) {
      this.waitTimer--;
      return;
    }

    const blocks = this.script.blocks || [];
    if (this.pc >= blocks.length) {
      if (this.stack.length > 0) {
        const frame = this.stack[this.stack.length - 1];
        if (frame.type === 'repeat') {
          frame.count--;
          if (frame.count > 0) {
            this.pc = frame.loopStart;
            return;
          }
        } else if (frame.type === 'forever') {
          this.pc = frame.loopStart;
          return;
        }
        this.stack.pop();
      } else {
        this.isDone = true;
        return;
      }
    }

    const block = blocks[this.pc];
    if (!block) {
      this.pc++;
      return;
    }

    this.executeBlock(block);
    this.pc++;
  }

  executeBlock(block) {
    const s = this.sprite;
    const rt = this.runtime;

    switch (block.opcode) {
      // Motion
      case 'move_steps': {
        const steps = Number(block.inputs.steps || 10);
        const rad = ((s.direction - 90) * Math.PI) / 180;
        const oldX = s.x;
        const oldY = s.y;
        s.x += Math.cos(rad) * steps;
        s.y -= Math.sin(rad) * steps;
        if (s.penDown) {
          rt.drawPenLine(oldX, oldY, s.x, s.y, s.penColor, s.penSize);
        }
        break;
      }
      case 'turn_right': {
        const deg = Number(block.inputs.degrees || 15);
        s.direction = (s.direction + deg) % 360;
        break;
      }
      case 'turn_left': {
        const deg = Number(block.inputs.degrees || 15);
        s.direction = (s.direction - deg + 360) % 360;
        break;
      }
      case 'goto_xy': {
        const oldX = s.x;
        const oldY = s.y;
        s.x = Number(block.inputs.x || 0);
        s.y = Number(block.inputs.y || 0);
        if (s.penDown) {
          rt.drawPenLine(oldX, oldY, s.x, s.y, s.penColor, s.penSize);
        }
        break;
      }
      case 'point_direction': {
        s.direction = Number(block.inputs.direction || 90);
        break;
      }
      case 'bounce_edge': {
        if (s.x > 220 || s.x < -220) {
          s.direction = (-s.direction + 360) % 360;
          s.x = Math.max(-220, Math.min(220, s.x));
        }
        if (s.y > 160 || s.y < -160) {
          s.direction = (180 - s.direction + 360) % 360;
          s.y = Math.max(-160, Math.min(160, s.y));
        }
        break;
      }

      // Looks
      case 'say_text': {
        s.sayText = String(block.inputs.text || '¡Hola!');
        break;
      }
      case 'change_size': {
        s.size = Math.max(10, s.size + Number(block.inputs.change || 10));
        break;
      }
      case 'set_size': {
        s.size = Math.max(10, Number(block.inputs.size || 100));
        break;
      }
      case 'show': {
        s.visible = true;
        break;
      }
      case 'hide': {
        s.visible = false;
        break;
      }

      // Sound
      case 'play_sound': {
        const soundType = String(block.inputs.sound || 'jump');
        rt.sound.playPreset(soundType);
        break;
      }

      // Control
      case 'wait_seconds': {
        const secs = Number(block.inputs.seconds || 1);
        this.waitTimer = Math.round(secs * 60);
        break;
      }
      case 'forever_loop': {
        this.stack.push({ type: 'forever', loopStart: this.pc });
        break;
      }
      case 'repeat_loop': {
        const times = Number(block.inputs.times || 10);
        this.stack.push({ type: 'repeat', count: times, loopStart: this.pc });
        break;
      }

      // Pen (PenguinMod Canvas+)
      case 'pen_down': {
        s.penDown = true;
        break;
      }
      case 'pen_up': {
        s.penDown = false;
        break;
      }
      case 'pen_clear': {
        rt.clearPen();
        break;
      }
      case 'pen_color': {
        s.penColor = block.inputs.color || '#00c3ff';
        break;
      }

      // Physics (PenguinMod Physics)
      case 'set_gravity': {
        s.gravity = Number(block.inputs.gravity || 0.8);
        break;
      }
      case 'apply_force': {
        s.vx += Number(block.inputs.vx || 0);
        s.vy += Number(block.inputs.vy || 0);
        break;
      }

      // Variables
      case 'change_var': {
        const varName = block.inputs.var || 'puntos';
        const val = Number(block.inputs.val || 1);
        rt.variables[varName] = (rt.variables[varName] || 0) + val;
        break;
      }
      case 'set_var': {
        const varName = block.inputs.var || 'puntos';
        rt.variables[varName] = Number(block.inputs.val || 0);
        break;
      }
    }
  }
}

window.PenguinRuntime = PenguinRuntime;
window.Sprite = Sprite;
