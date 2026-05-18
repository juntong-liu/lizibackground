/**
 * ParticleBackground — 全屏 Canvas 粒子流场背景
 * @example
 * const bg = new ParticleBackground(document.getElementById('scene'), {
 *   particleCount: 220,
 *   maxDist: 120,
 *   trailAlpha: 0.14,
 * });
 * bg.emitPulse(window.innerWidth / 2, window.innerHeight / 2);
 */
(function (global) {
  "use strict";

  const DEFAULTS = {
    particleCount: null,
    densityDivisor: 9000,
    minParticles: 120,
    maxParticles: 300,
    maxDist: 120,
    trailAlpha: 0.14,
    hueMin: 190,
    hueRange: 45,
    pointerRadius: 220,
    pointerRadiusDown: 340,
    pointerForce: 0.34,
    pointerForceDown: 0.82,
    maxDpr: 2,
    reducedMotion: true,
    pauseWhenHidden: true,
    gridCellSize: 128,
  };

  function flowField(x, y, time) {
    const t = time * 0.00055;
    const a = Math.sin(x * 0.0024 + t) * 1.8;
    const b = Math.cos(y * 0.0022 - t * 1.3) * 1.6;
    const c = Math.sin((x + y) * 0.0011 - t * 0.7) * Math.PI;
    const angle = a + b + c;
    return { x: Math.cos(angle), y: Math.sin(angle) };
  }

  class Particle {
    constructor(index, host) {
      this.index = index;
      this.host = host;
      this.reset(true);
    }

    reset(initial) {
      const spread = initial ? 1 : 0.2;
      const { width, height } = this.host.state;
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * spread;
      this.vy = (Math.random() - 0.5) * spread;
      this.size = 0.7 + Math.random() * 2.2;
      this.hue = this.host.options.hueMin + Math.random() * this.host.options.hueRange;
      this.alpha = 0.35 + Math.random() * 0.5;
      this.orbit = 0.002 + Math.random() * 0.0032;
      this.wander = 0.8 + Math.random() * 1.8;
    }

    update(time) {
      const host = this.host;
      const state = host.state;
      const opts = host.options;
      const field = flowField(this.x, this.y, time);
      this.vx += field.x * 0.028;
      this.vy += field.y * 0.028;

      const dx = state.pointer.x - this.x;
      const dy = state.pointer.y - this.y;
      const distSq = dx * dx + dy * dy;
      const pointerRadius = state.pointer.down ? opts.pointerRadiusDown : opts.pointerRadius;

      if (state.pointer.active && distSq < pointerRadius * pointerRadius) {
        const dist = Math.max(18, Math.sqrt(distSq));
        const forceScale = state.pointer.down ? opts.pointerForceDown : opts.pointerForce;
        const force = (1 - dist / pointerRadius) * forceScale;
        this.vx -= (dx / dist) * force * 0.9;
        this.vy -= (dy / dist) * force * 0.9;
        this.vx += state.pointer.speedX * 0.0026;
        this.vy += state.pointer.speedY * 0.0026;
      }

      for (let i = state.pulses.length - 1; i >= 0; i--) {
        const pulse = state.pulses[i];
        const px = this.x - pulse.x;
        const py = this.y - pulse.y;
        const pulseDist = Math.sqrt(px * px + py * py);
        const edge = Math.abs(pulseDist - pulse.radius);
        if (edge < 80) {
          const push = (1 - edge / 80) * pulse.force;
          this.vx += (px / (pulseDist || 1)) * push;
          this.vy += (py / (pulseDist || 1)) * push;
        }
      }

      const swirl = Math.sin(time * 0.001 + this.index * this.orbit) * this.wander;
      this.vx += Math.cos(time * 0.0014 + this.y * 0.003) * 0.005 * swirl;
      this.vy += Math.sin(time * 0.0011 + this.x * 0.003) * 0.005 * swirl;

      this.vx *= 0.965;
      this.vy *= 0.965;
      this.x += this.vx;
      this.y += this.vy;

      if (this.x < -40 || this.x > state.width + 40 || this.y < -40 || this.y > state.height + 40) {
        this.reset();
      }
    }

    draw(ctx) {
      const speed = Math.hypot(this.vx, this.vy);
      const glow = Math.min(18, 5 + speed * 4);
      ctx.beginPath();
      ctx.fillStyle = `hsla(${this.hue}, 100%, 72%, ${this.alpha})`;
      ctx.shadowColor = `hsla(${this.hue}, 100%, 70%, 0.55)`;
      ctx.shadowBlur = glow;
      ctx.arc(this.x, this.y, this.size + speed * 0.18, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  class Spark {
    constructor(x, y, angle, speed, hue, size) {
      this.x = x;
      this.y = y;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
      this.hue = hue;
      this.life = 1;
      this.decay = 0.012 + Math.random() * 0.01;
      this.size = size;
    }

    update() {
      this.vx *= 0.985;
      this.vy *= 0.985;
      this.vy += 0.01;
      this.x += this.vx;
      this.y += this.vy;
      this.life -= this.decay;
    }

    draw(ctx) {
      if (this.life <= 0) return;
      ctx.beginPath();
      ctx.fillStyle = `hsla(${this.hue}, 100%, 72%, ${this.life * 0.8})`;
      ctx.shadowColor = `hsla(${this.hue}, 100%, 72%, ${this.life})`;
      ctx.shadowBlur = 18;
      ctx.arc(this.x, this.y, this.size * this.life, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  class ParticleBackground {
    constructor(canvas, options = {}) {
      if (!canvas || !canvas.getContext) {
        throw new Error("ParticleBackground: 需要有效的 canvas 元素");
      }

      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.options = { ...DEFAULTS, ...options };
      this._destroyed = false;
      this._rafId = 0;
      this._interactionEnabled = true;
      this._bound = {};

      this.state = {
        width: 0,
        height: 0,
        dpr: 1,
        particles: [],
        sparks: [],
        pulses: [],
        pointer: {
          x: 0,
          y: 0,
          lastX: 0,
          lastY: 0,
          speedX: 0,
          speedY: 0,
          active: false,
          down: false,
        },
        time: 0,
        grid: new Map(),
      };

      this._reducedMotion =
        this.options.reducedMotion &&
        global.matchMedia &&
        global.matchMedia("(prefers-reduced-motion: reduce)").matches;

      this._bindEvents();
      this.resize();
      this.emitPulse(global.innerWidth * 0.5, global.innerHeight * 0.5);
      this._loop();
    }

    setInteractionEnabled(enabled) {
      this._interactionEnabled = Boolean(enabled);
      if (!enabled) {
        this.state.pointer.active = false;
        this.state.pointer.down = false;
      }
    }

    resize() {
      const opts = this.options;
      this.state.width = global.innerWidth;
      this.state.height = global.innerHeight;
      this.state.dpr = Math.min(global.devicePixelRatio || 1, opts.maxDpr);

      this.canvas.width = Math.floor(this.state.width * this.state.dpr);
      this.canvas.height = Math.floor(this.state.height * this.state.dpr);
      this.ctx.setTransform(this.state.dpr, 0, 0, this.state.dpr, 0, 0);

      let count = opts.particleCount;
      if (count == null) {
        const density = Math.max(
          opts.minParticles,
          Math.floor((this.state.width * this.state.height) / opts.densityDivisor)
        );
        count = Math.min(opts.maxParticles, density);
      }

      if (this._reducedMotion) {
        count = Math.min(count, 80);
      }

      const particles = this.state.particles;
      if (particles.length > count) {
        particles.length = count;
      }
      while (particles.length < count) {
        particles.push(new Particle(particles.length, this));
      }
    }

    emitPulse(x, y) {
      this.state.pulses.push({
        x,
        y,
        radius: 0,
        force: 0.75 + Math.random() * 0.25,
        alpha: 0.8,
      });

      const sparkCount = this._reducedMotion ? 12 : 38;
      const hueBase = this.options.hueMin;
      for (let i = 0; i < sparkCount; i++) {
        this.state.sparks.push(
          new Spark(
            x,
            y,
            (Math.PI * 2 * i) / sparkCount + Math.random() * 0.2,
            2.2 + Math.random() * 5.2,
            hueBase + Math.random() * this.options.hueRange,
            1.4 + Math.random() * 2.2
          )
        );
      }
    }

    pause() {
      if (this._rafId) {
        cancelAnimationFrame(this._rafId);
        this._rafId = 0;
      }
    }

    resume() {
      if (!this._rafId && !this._destroyed) {
        this._loop();
      }
    }

    destroy() {
      if (this._destroyed) return;
      this._destroyed = true;
      this.pause();
      global.removeEventListener("resize", this._bound.onResize);
      this.canvas.removeEventListener("pointermove", this._bound.onPointerMove);
      this.canvas.removeEventListener("pointerdown", this._bound.onPointerDown);
      global.removeEventListener("pointerup", this._bound.onPointerUp);
      this.canvas.removeEventListener("pointerleave", this._bound.onPointerLeave);
      if (this.options.pauseWhenHidden) {
        document.removeEventListener("visibilitychange", this._bound.onVisibility);
      }
      this.state.particles = [];
      this.state.sparks = [];
      this.state.pulses = [];
    }

    _bindEvents() {
      this._bound.onResize = () => this.resize();
      this._bound.onPointerMove = (e) => this._updatePointer(e);
      this._bound.onPointerDown = (e) => {
        if (!this._interactionEnabled) return;
        this.state.pointer.down = true;
        this._updatePointer(e);
        this.emitPulse(e.clientX, e.clientY);
      };
      this._bound.onPointerUp = () => {
        this.state.pointer.down = false;
      };
      this._bound.onPointerLeave = () => {
        this.state.pointer.active = false;
        this.state.pointer.down = false;
      };
      this._bound.onVisibility = () => {
        if (document.hidden) this.pause();
        else this.resume();
      };

      global.addEventListener("resize", this._bound.onResize);
      this.canvas.addEventListener("pointermove", this._bound.onPointerMove);
      this.canvas.addEventListener("pointerdown", this._bound.onPointerDown);
      global.addEventListener("pointerup", this._bound.onPointerUp);
      this.canvas.addEventListener("pointerleave", this._bound.onPointerLeave);

      if (this.options.pauseWhenHidden) {
        document.addEventListener("visibilitychange", this._bound.onVisibility);
      }
    }

    _updatePointer(event) {
      if (!this._interactionEnabled) return;
      const x = event.clientX;
      const y = event.clientY;
      const p = this.state.pointer;
      p.speedX = x - p.lastX;
      p.speedY = y - p.lastY;
      p.lastX = x;
      p.lastY = y;
      p.x = x;
      p.y = y;
      p.active = true;
    }

    _buildGrid() {
      const cell = this.options.gridCellSize;
      const grid = this.state.grid;
      grid.clear();
      const particles = this.state.particles;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const key = `${(p.x / cell) | 0},${(p.y / cell) | 0}`;
        if (!grid.has(key)) grid.set(key, []);
        grid.get(key).push(p);
      }
    }

    _connectParticles() {
      const maxDist = this.options.maxDist;
      const maxDistSq = maxDist * maxDist;
      const cell = this.options.gridCellSize;
      const ctx = this.ctx;
      const grid = this.state.grid;
      const visited = new Set();

      for (const [key, list] of grid) {
        const [cx, cy] = key.split(",").map(Number);
        for (let ox = -1; ox <= 1; ox++) {
          for (let oy = -1; oy <= 1; oy++) {
            const neighbor = grid.get(`${cx + ox},${cy + oy}`);
            if (!neighbor) continue;
            for (let i = 0; i < list.length; i++) {
              const a = list[i];
              for (let j = 0; j < neighbor.length; j++) {
                const b = neighbor[j];
                if (a === b) continue;
                const pairKey = a.index < b.index ? `${a.index}-${b.index}` : `${b.index}-${a.index}`;
                if (visited.has(pairKey)) continue;
                const dx = a.x - b.x;
                const dy = a.y - b.y;
                const distSq = dx * dx + dy * dy;
                if (distSq > maxDistSq) continue;
                visited.add(pairKey);
                const dist = Math.sqrt(distSq);
                const alpha = (1 - dist / maxDist) * 0.22;
                const gradient = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
                gradient.addColorStop(0, `hsla(${a.hue}, 100%, 70%, ${alpha})`);
                gradient.addColorStop(1, `hsla(${b.hue}, 100%, 72%, ${alpha * 0.6})`);
                ctx.beginPath();
                ctx.strokeStyle = gradient;
                ctx.lineWidth = 0.55 + alpha * 1.2;
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
                ctx.stroke();
              }
            }
          }
        }
      }
    }

    _drawBackgroundGlow(time) {
      const { width, height } = this.state;
      const pulse = 0.5 + Math.sin(time * 0.0012) * 0.12;
      const gradient = this.ctx.createRadialGradient(
        width * 0.5,
        height * 0.48,
        0,
        width * 0.5,
        height * 0.48,
        Math.max(width, height) * 0.58
      );
      gradient.addColorStop(0, `rgba(18, 52, 95, ${0.18 * pulse})`);
      gradient.addColorStop(0.35, `rgba(9, 19, 40, ${0.12 * pulse})`);
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      const ctx = this.ctx;
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }

    _drawPointerGlow() {
      const p = this.state.pointer;
      if (!p.active) return;
      const ring = 20 + Math.min(50, Math.hypot(p.speedX, p.speedY) * 0.8);
      const glow = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, ring);
      glow.addColorStop(0, "rgba(159, 223, 255, 0.18)");
      glow.addColorStop(0.55, "rgba(74, 141, 255, 0.09)");
      glow.addColorStop(1, "rgba(0, 0, 0, 0)");
      this.ctx.fillStyle = glow;
      this.ctx.fillRect(p.x - ring, p.y - ring, ring * 2, ring * 2);
    }

    _animate(time) {
      if (this._destroyed) return;
      this._rafId = 0;
      this.state.time = time;
      const ctx = this.ctx;
      const { width, height } = this.state;
      const trail = this.options.trailAlpha;

      ctx.fillStyle = `rgba(0, 0, 0, ${trail})`;
      ctx.fillRect(0, 0, width, height);

      this._drawBackgroundGlow(time);
      ctx.shadowBlur = 0;

      const pulses = this.state.pulses;
      for (let i = pulses.length - 1; i >= 0; i--) {
        const pulse = pulses[i];
        pulse.radius += 7.5;
        pulse.alpha *= 0.966;
        ctx.beginPath();
        ctx.strokeStyle = `rgba(142, 216, 255, ${pulse.alpha * 0.25})`;
        ctx.lineWidth = 1.4;
        ctx.shadowColor = `rgba(142, 216, 255, ${pulse.alpha * 0.55})`;
        ctx.shadowBlur = 24;
        ctx.arc(pulse.x, pulse.y, pulse.radius, 0, Math.PI * 2);
        ctx.stroke();
        if (pulse.alpha < 0.02) pulses.splice(i, 1);
      }

      const particles = this.state.particles;
      for (let i = 0; i < particles.length; i++) {
        particles[i].update(time);
      }

      this._buildGrid();
      this._connectParticles();

      for (let i = 0; i < particles.length; i++) {
        particles[i].draw(ctx);
      }

      const sparks = this.state.sparks;
      for (let i = sparks.length - 1; i >= 0; i--) {
        sparks[i].update();
        sparks[i].draw(ctx);
        if (sparks[i].life <= 0) sparks.splice(i, 1);
      }

      this._drawPointerGlow();
      this._loop();
    }

    _loop() {
      this._rafId = requestAnimationFrame((t) => this._animate(t));
    }
  }

  global.ParticleBackground = ParticleBackground;
})(typeof window !== "undefined" ? window : globalThis);
