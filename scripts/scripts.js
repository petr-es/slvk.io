/* ==========================================================================
   petrslavik.design / slvk.io — page logic

   The page is rendered by the dc-runtime (scripts/vendor/dc-runtime.js),
   which reads its logic class only from the inline text of
   <script data-dc-script> in index.html (it has no src support) and
   evaluates that text with DCLogic and React passed in as arguments. So the
   class cannot simply be declared here: this file exposes a factory, and the
   inline stub in index.html calls it with the runtime's DCLogic and React.

   Load order matters. The <script> tag for this file sits in <head> before
   dc-runtime.js. Scripts in <head> run in document order and the runtime
   boots only once the document has parsed, so the factory is always defined
   before the runtime evaluates the stub.
   ========================================================================== */

window.createPageComponent = function (DCLogic, React) {
  return class Component extends DCLogic {
    state = { menuOpen: false, loaded: false, pct: 0, headerHidden: false, quoteIndex: 0 };
    patternRef = React.createRef();
    _patternPoints = [];
    _patternMouse = { x: -9999, y: -9999 };
    _patternActive = false;

    componentDidUpdate() {
      this._maybeInitPattern();
      this._observeNewReveals();
    }

    _observeNewReveals() {
      if (!this._io || !this._observedReveals) return;
      document.querySelectorAll('.reveal').forEach((el, i) => {
        if (!this._observedReveals.has(el)) {
          this._observedReveals.add(el);
          if (el.dataset.revealDelay === undefined) el.dataset.revealDelay = i === 0 ? 0 : 180;
          this._io.observe(el);
        }
      });
    }

    _maybeInitPattern() {
      const mode = 'grid';
      const want = true;
      const canvas = this.patternRef.current;
      if (want && canvas && (!this._patternActive || this._patternMode !== mode)) {
        if (this._patternActive) this._teardownPattern();
        this._patternActive = true;
        this._patternMode = mode;
        this._setupPattern(canvas, mode);
      } else if ((!want || !canvas) && this._patternActive) {
        this._patternActive = false;
        this._teardownPattern();
      }
    }

    _setupPattern(canvas, mode) {
      const ctx = canvas.getContext('2d');
      this._patternMove = e => {
        this._patternMouse.x = e.clientX;
        this._patternMouse.y = e.clientY;
        const el = document.elementFromPoint(e.clientX, e.clientY);
        this._patternOverInteractive = !!(el && el.closest('a, button'));
      };
      window.addEventListener('mousemove', this._patternMove);

      if (mode === 'grid') return this._runGridMode(canvas, ctx);
      if (mode === 'spokes') return this._runSpokesMode(canvas, ctx);
      if (mode === 'ripple') return this._runRippleMode(canvas, ctx);
      if (mode === 'stars') return this._runStarsMode(canvas, ctx);
      if (mode === 'waves') return this._runWavesMode(canvas, ctx);
      if (mode === 'magnetic') return this._runMagneticMode(canvas, ctx);
    }

    _runStarsMode(canvas, ctx) {
      const resize = () => {
        const w = window.innerWidth, h = window.innerHeight;
        canvas.width = w;
        canvas.height = h;
        const count = Math.max(60, Math.min(140, Math.round((w * h) / 14000)));
        this._patternPoints = Array.from({ length: count }, () => ({
          x: Math.random() * w,
          y: Math.random() * h,
          r: Math.random() * 1.2 + 0.6,
          phase: Math.random() * Math.PI * 2,
          speed: 0.6 + Math.random() * 0.8
        }));
      };
      resize();
      this._patternResize = resize;
      window.addEventListener('resize', resize);

      const glowRadius = 200, t0 = Date.now();
      const draw = () => {
        const w = canvas.width, h = canvas.height;
        ctx.clearRect(0, 0, w, h);
        const t = (Date.now() - t0) / 1000;
        const mx = this._patternMouse.x, my = this._patternMouse.y;
        this._patternPoints.forEach(p => {
          const twinkle = 0.25 + 0.2 * Math.sin(t * p.speed + p.phase);
          const dx = mx - p.x, dy = my - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const boost = Math.max(0, 1 - dist / glowRadius);
          ctx.fillStyle = `rgba(20,20,20,${Math.min(0.85, twinkle + boost * 0.5)})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r + boost * 1.2, 0, Math.PI * 2);
          ctx.fill();
        });
        this._patternRaf = requestAnimationFrame(draw);
      };
      draw();
    }

    _runWavesMode(canvas, ctx) {
      const resize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      };
      resize();
      this._patternResize = resize;
      window.addEventListener('resize', resize);

      const rowGap = 46, t0 = Date.now();
      const draw = () => {
        const w = canvas.width, h = canvas.height;
        ctx.clearRect(0, 0, w, h);
        const t = (Date.now() - t0) / 1000;
        const mx = this._patternMouse.x, my = this._patternMouse.y;
        for (let y = rowGap; y < h; y += rowGap) {
          ctx.strokeStyle = 'rgba(20,20,20,0.1)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          for (let x = 0; x <= w; x += 12) {
            const dy = y - my, dx = x - mx;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const lift = Math.max(0, 1 - dist / 260) * 22;
            const base = Math.sin(x * 0.01 + t * 0.6 + y * 0.02) * 6;
            const py = y + base - lift;
            if (x === 0) ctx.moveTo(x, py); else ctx.lineTo(x, py);
          }
          ctx.stroke();
        }
        this._patternRaf = requestAnimationFrame(draw);
      };
      draw();
    }

    _runMagneticMode(canvas, ctx) {
      const resize = () => {
        const w = window.innerWidth, h = window.innerHeight;
        canvas.width = w;
        canvas.height = h;
        const spacing = 48;
        const cols = Math.ceil(w / spacing) + 1;
        const rows = Math.ceil(h / spacing) + 1;
        const pts = [];
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            pts.push({ x: c * spacing, y: r * spacing });
          }
        }
        this._patternPoints = pts;
      };
      resize();
      this._patternResize = resize;
      window.addEventListener('resize', resize);

      const radius = 130;
      const draw = () => {
        const w = canvas.width, h = canvas.height;
        ctx.clearRect(0, 0, w, h);
        const mx = this._patternMouse.x, my = this._patternMouse.y;
        this._patternPoints.forEach(p => {
          const dx = mx - p.x, dy = my - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          let reveal = Math.max(0, 1 - dist / radius);
          if (this._patternOverInteractive) reveal *= 0.2;
          if (reveal <= 0) return;
          const f = reveal * 5;
          const x = p.x + (dx / (dist || 1)) * f;
          const y = p.y + (dy / (dist || 1)) * f;
          ctx.strokeStyle = `rgba(20,20,20,${reveal * 0.18})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(x, y);
          ctx.stroke();
          ctx.fillStyle = `rgba(20,20,20,${0.2 * reveal})`;
          ctx.beginPath();
          ctx.arc(x, y, 1.2, 0, Math.PI * 2);
          ctx.fill();
        });
        this._patternRaf = requestAnimationFrame(draw);
      };
      draw();
    }

    _runGridMode(canvas, ctx) {
      const resize = () => {
        const w = window.innerWidth, h = window.innerHeight;
        canvas.width = w;
        canvas.height = h;
        const spacing = 90;
        const cols = Math.ceil(w / spacing) + 1;
        const rows = Math.ceil(h / spacing) + 1;
        const pts = [];
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            pts.push({
              x: c * spacing + (Math.random() - 0.5) * spacing * 0.5,
              y: r * spacing + (Math.random() - 0.5) * spacing * 0.5,
              phase: Math.random() * Math.PI * 2
            });
          }
        }
        this._patternPoints = pts;
      };
      resize();
      this._patternResize = resize;
      window.addEventListener('resize', resize);

      const connectDist = 130, radius = 130, revealRadius = 260, t0 = Date.now();
      const draw = () => {
        const w = canvas.width, h = canvas.height;
        ctx.clearRect(0, 0, w, h);
        const t = (Date.now() - t0) / 1000;
        const mx = this._patternMouse.x, my = this._patternMouse.y;
        const pts = this._patternPoints.map(p => {
          const x0 = p.x + Math.sin(t * 0.3 + p.phase) * 14;
          const y0 = p.y + Math.cos(t * 0.25 + p.phase) * 14;
          const dx = mx - x0, dy = my - y0;
          const dist = Math.sqrt(dx * dx + dy * dy);
          let x = x0, y = y0;
          if (dist < radius) {
            const f = (1 - dist / radius) * 8;
            x += (dx / (dist || 1)) * f;
            y += (dy / (dist || 1)) * f;
          }
          let reveal = Math.max(0, 1 - dist / revealRadius);
          if (this._patternOverInteractive) reveal *= 0.2;
          return { x, y, reveal };
        });
        for (let i = 0; i < pts.length; i++) {
          if (pts[i].reveal <= 0) continue;
          for (let j = i + 1; j < pts.length; j++) {
            if (pts[j].reveal <= 0) continue;
            const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d < connectDist) {
              const reveal = Math.min(pts[i].reveal, pts[j].reveal);
              ctx.strokeStyle = `rgba(20,20,20,${(1 - d / connectDist) * 0.18 * reveal})`;
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(pts[i].x, pts[i].y);
              ctx.lineTo(pts[j].x, pts[j].y);
              ctx.stroke();
            }
          }
        }
        pts.forEach(p => {
          if (p.reveal <= 0) return;
          ctx.fillStyle = `rgba(20,20,20,${0.2 * p.reveal})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 1.2, 0, Math.PI * 2);
          ctx.fill();
        });
        this._patternRaf = requestAnimationFrame(draw);
      };
      draw();
    }

    _runSpokesMode(canvas, ctx) {
      const resize = () => {
        const w = window.innerWidth, h = window.innerHeight;
        canvas.width = w;
        canvas.height = h;
        const count = Math.max(40, Math.min(90, Math.round((w * h) / 22000)));
        this._patternPoints = Array.from({ length: count }, () => ({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25
        }));
      };
      resize();
      this._patternResize = resize;
      window.addEventListener('resize', resize);

      const radius = 220;
      const draw = () => {
        const w = canvas.width, h = canvas.height;
        ctx.clearRect(0, 0, w, h);
        const mx = this._patternMouse.x, my = this._patternMouse.y;
        this._patternPoints.forEach(p => {
          p.x += p.vx; p.y += p.vy;
          if (p.x < 0 || p.x > w) p.vx *= -1;
          if (p.y < 0 || p.y > h) p.vy *= -1;
          const dx = mx - p.x, dy = my - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const reveal = Math.max(0, 1 - dist / radius);
          if (reveal > 0) {
            ctx.strokeStyle = `rgba(20,20,20,${reveal * 0.28})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(mx, my);
            ctx.lineTo(p.x, p.y);
            ctx.stroke();
            ctx.fillStyle = `rgba(20,20,20,${0.35 + reveal * 0.4})`;
          } else {
            ctx.fillStyle = 'rgba(20,20,20,.22)';
          }
          ctx.beginPath();
          ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
          ctx.fill();
        });
        if (mx > -9000) {
          ctx.fillStyle = 'rgba(20,20,20,.5)';
          ctx.beginPath();
          ctx.arc(mx, my, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
        this._patternRaf = requestAnimationFrame(draw);
      };
      draw();
    }

    _runRippleMode(canvas, ctx) {
      const resize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      };
      resize();
      this._patternResize = resize;
      window.addEventListener('resize', resize);

      const spacing = 56, maxDist = 260, t0 = Date.now();
      const draw = () => {
        const w = canvas.width, h = canvas.height;
        ctx.clearRect(0, 0, w, h);
        const mx = this._patternMouse.x, my = this._patternMouse.y;
        if (mx > -9000) {
          const t = (Date.now() - t0) / 1000;
          for (let x = 0; x <= w; x += spacing) {
            const dx = x - mx;
            if (Math.abs(dx) > maxDist) continue;
            const reveal = 1 - Math.abs(dx) / maxDist;
            ctx.strokeStyle = `rgba(20,20,20,${reveal * 0.22})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let y = 0; y <= h; y += 8) {
              const dy = y - my;
              const d = Math.sqrt(dx * dx + dy * dy);
              const bend = Math.sin(d * 0.04 - t * 2) * reveal * 10 * Math.max(0, 1 - Math.abs(dy) / maxDist);
              const px = x + bend;
              if (y === 0) ctx.moveTo(px, y); else ctx.lineTo(px, y);
            }
            ctx.stroke();
          }
        }
        this._patternRaf = requestAnimationFrame(draw);
      };
      draw();
    }

    _teardownPattern() {
      if (this._patternRaf) cancelAnimationFrame(this._patternRaf);
      if (this._patternResize) window.removeEventListener('resize', this._patternResize);
      if (this._patternMove) window.removeEventListener('mousemove', this._patternMove);
    }

    componentDidMount() {
      this._maybeInitPattern();
      this._lastY = window.scrollY;
      this._onScroll = () => {
        const y = window.scrollY;
        const goingDown = y > this._lastY;
        if (y > 80 && goingDown && !this.state.menuOpen) {
          if (!this.state.headerHidden) this.setState({ headerHidden: true });
        } else {
          if (this.state.headerHidden) this.setState({ headerHidden: false });
        }
        this._lastY = y;
      };
      window.addEventListener('scroll', this._onScroll, { passive: true });

      const start = Date.now();
      // Loader counter length in ms; the loader then holds at 100% for 150ms
      // (minDelay below) and waits for fonts before the page fades in.
      const duration = 400;
      this._pctTimer = setInterval(() => {
        const t = Math.min(1, (Date.now() - start) / duration);
        this.setState({ pct: Math.round(t * 100) });
        if (t >= 1) clearInterval(this._pctTimer);
      }, 16);

      const minDelay = new Promise(r => setTimeout(r, duration + 150));
      const fonts = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
      Promise.all([minDelay, fonts]).then(() => this.setState({ loaded: true }));

      const io = new IntersectionObserver(entries => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const extraDelay = Number(el.dataset.revealDelay || 0);
            el.style.transitionDelay = extraDelay + 'ms';
            el.classList.add('is-visible');
            io.unobserve(el);
          }
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
      this._io = io;
      this._observedReveals = new WeakSet();
      document.querySelectorAll('.reveal').forEach((el, i) => {
        el.dataset.revealDelay = i === 0 ? 0 : 180;
        this._observedReveals.add(el);
        io.observe(el);
      });
    }

    componentWillUnmount() {
      if (this._io) this._io.disconnect();
      if (this._onScroll) window.removeEventListener('scroll', this._onScroll);
      this._teardownPattern();
    }

    renderVals() {
      const dark = true;
      return {
        menuState: this.state.menuOpen ? 'open' : 'closed',
        toggleMenu: () => this.setState(s => ({ menuOpen: !s.menuOpen })),
        closeMenu: () => this.setState({ menuOpen: false }),
        loaderState: this.state.loaded ? 'hidden' : 'visible',
        loadedAttr: this.state.loaded ? 'true' : 'false',
        loaderPct: this.state.pct + '%',
        headerTranslate: this.state.headerHidden ? '-100%' : '0',
        quoteOffset: `-${this.state.quoteIndex * 100}%`,
        dot0Color: this.state.quoteIndex === 0 ? '#141414' : 'rgba(0,0,0,.2)',
        dot1Color: this.state.quoteIndex === 1 ? '#141414' : 'rgba(0,0,0,.2)',
        dot2Color: this.state.quoteIndex === 2 ? '#141414' : 'rgba(0,0,0,.2)',
        dot3Color: this.state.quoteIndex === 3 ? '#141414' : 'rgba(0,0,0,.2)',
        goPrev: () => this.setState(s => ({ quoteIndex: (s.quoteIndex + 3) % 4 })),
        goNext: () => this.setState(s => ({ quoteIndex: (s.quoteIndex + 1) % 4 })),
        patternRef: this.patternRef,
        patternEnabled: true,
        loaderDashOffset: 201.06 * (1 - this.state.pct / 100),
        contactBg: dark ? '#141414' : 'transparent',
        contactBorder: dark ? 'rgba(255,255,255,.15)' : 'rgba(0,0,0,.1)',
        contactLabel: dark ? 'rgba(255,255,255,.45)' : 'rgba(0,0,0,.4)',
        contactText: dark ? '#f2f1ee' : '#141414',
        contactMuted: dark ? 'rgba(255,255,255,.65)' : 'rgba(0,0,0,.65)',
        footerText: dark ? 'rgba(255,255,255,.6)' : 'rgba(0,0,0,.55)',
        btnPrimaryBg: dark ? '#f2f1ee' : '#141414',
        btnPrimaryText: dark ? '#141414' : '#fff',
        btnSecondaryBorder: dark ? 'rgba(255,255,255,.35)' : 'rgba(0,0,0,.3)',
        btnSecondaryText: dark ? '#f2f1ee' : '#141414'
      };
    }
  };
};
