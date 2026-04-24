/* ============================================================
   $MASCOTS · shared FX library
   WebAudio-synthesised sounds (no external files), haptics,
   number-count, reveal, magnetic / tilt helpers.
   Works offline. One user gesture unlocks audio automatically.
   ============================================================ */
(function (global) {
  // ---------- Audio ----------
  let ctx, master;
  let enabled = (function () {
    try {
      return localStorage.getItem("mascots_fx") !== "off";
    } catch (e) {
      return true;
    }
  })();

  function init() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = enabled ? 0.22 : 0;
    master.connect(ctx.destination);
  }

  function unlock() {
    init();
    if (ctx && ctx.state === "suspended") ctx.resume();
  }
  // first gesture unlocks
  ["pointerdown", "keydown", "touchstart"].forEach((ev) =>
    document.addEventListener(ev, unlock, { once: true, passive: true })
  );

  function envelope(g, attack, sustain, release, peak) {
    const t = ctx.currentTime;
    g.gain.cancelScheduledValues(t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + attack);
    g.gain.linearRampToValueAtTime(peak, t + attack + sustain);
    g.gain.linearRampToValueAtTime(0, t + attack + sustain + release);
    return t + attack + sustain + release;
  }

  // Short, bright referee whistle — two-tone chirp
  function whistle() {
    if (!enabled) return;
    init();
    if (!ctx) return;
    const o1 = ctx.createOscillator(),
      o2 = ctx.createOscillator(),
      g = ctx.createGain();
    o1.type = "triangle";
    o2.type = "triangle";
    const t = ctx.currentTime;
    o1.frequency.setValueAtTime(2400, t);
    o1.frequency.linearRampToValueAtTime(2650, t + 0.18);
    o2.frequency.setValueAtTime(2415, t);
    o2.frequency.linearRampToValueAtTime(2665, t + 0.18);
    const end = envelope(g, 0.02, 0.16, 0.06, 0.28);
    o1.connect(g);
    o2.connect(g);
    g.connect(master);
    o1.start(t);
    o2.start(t);
    o1.stop(end);
    o2.stop(end);
  }

  // Low thump — ball on boot
  function kick() {
    if (!enabled) return;
    init();
    if (!ctx) return;
    const o = ctx.createOscillator(),
      g = ctx.createGain();
    o.type = "sine";
    const t = ctx.currentTime;
    o.frequency.setValueAtTime(200, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
    g.gain.setValueAtTime(0.5, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
    o.connect(g);
    g.connect(master);
    o.start(t);
    o.stop(t + 0.17);
  }

  // Short "click" tick
  function tick() {
    if (!enabled) return;
    init();
    if (!ctx) return;
    const o = ctx.createOscillator(),
      g = ctx.createGain();
    o.type = "square";
    o.frequency.value = 2600;
    const t = ctx.currentTime;
    g.gain.setValueAtTime(0.08, t);
    g.gain.exponentialRampToValueAtTime(0.0005, t + 0.03);
    o.connect(g);
    g.connect(master);
    o.start(t);
    o.stop(t + 0.04);
  }

  // Filtered-noise crowd swell
  function crowd(duration) {
    if (!enabled) return;
    duration = duration || 1.4;
    init();
    if (!ctx) return;
    const len = Math.floor(ctx.sampleRate * duration);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * 0.8;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f1 = ctx.createBiquadFilter();
    f1.type = "bandpass";
    f1.frequency.value = 900;
    f1.Q.value = 0.7;
    const f2 = ctx.createBiquadFilter();
    f2.type = "lowpass";
    f2.frequency.value = 2200;
    const g = ctx.createGain();
    const t = ctx.currentTime;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.22, t + 0.35);
    g.gain.linearRampToValueAtTime(0.18, t + duration * 0.7);
    g.gain.linearRampToValueAtTime(0, t + duration);
    src.connect(f1);
    f1.connect(f2);
    f2.connect(g);
    g.connect(master);
    src.start(t);
    src.stop(t + duration);
  }

  // Vuvuzela / stadium horn — beating detune
  function horn() {
    if (!enabled) return;
    init();
    if (!ctx) return;
    const o1 = ctx.createOscillator(),
      o2 = ctx.createOscillator(),
      g = ctx.createGain();
    o1.type = "sawtooth";
    o2.type = "square";
    o1.frequency.value = 233;
    o2.frequency.value = 234.8;
    const t = ctx.currentTime;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.18, t + 0.08);
    g.gain.linearRampToValueAtTime(0.14, t + 0.6);
    g.gain.linearRampToValueAtTime(0, t + 0.9);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 1800;
    o1.connect(lp);
    o2.connect(lp);
    lp.connect(g);
    g.connect(master);
    o1.start(t);
    o2.start(t);
    o1.stop(t + 0.95);
    o2.stop(t + 0.95);
  }

  // Triple pluck — ball hits the net
  function netRipple() {
    if (!enabled) return;
    init();
    if (!ctx) return;
    [0, 0.06, 0.12].forEach((delay, i) => {
      const o = ctx.createOscillator(),
        g = ctx.createGain();
      o.type = "triangle";
      o.frequency.value = 1500 - i * 260;
      const t = ctx.currentTime + delay;
      g.gain.setValueAtTime(0.14, t);
      g.gain.exponentialRampToValueAtTime(0.0005, t + 0.1);
      o.connect(g);
      g.connect(master);
      o.start(t);
      o.stop(t + 0.12);
    });
  }

  // "Goal" flourish — fanfare + crowd
  function goal() {
    if (!enabled) return;
    init();
    if (!ctx) return;
    crowd(2.4);
    [0, 0.12, 0.24].forEach((delay, i) => {
      const o = ctx.createOscillator(),
        g = ctx.createGain();
      o.type = "sawtooth";
      o.frequency.value = [392, 523, 659][i]; // G-C-E
      const t = ctx.currentTime + delay;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.14, t + 0.02);
      g.gain.linearRampToValueAtTime(0, t + 0.45);
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 2200;
      o.connect(lp);
      lp.connect(g);
      g.connect(master);
      o.start(t);
      o.stop(t + 0.5);
    });
  }

  function setEnabled(v) {
    enabled = !!v;
    try {
      localStorage.setItem("mascots_fx", enabled ? "on" : "off");
    } catch (e) {}
    if (!ctx && enabled) init();
    if (master) master.gain.value = enabled ? 0.22 : 0;
  }
  function isEnabled() {
    return enabled;
  }

  // ---------- Haptics ----------
  function buzz(pattern) {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {}
    }
  }

  // ---------- Reduced motion ----------
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  // ---------- Scroll reveal ----------
  function reveal(selector) {
    const els = document.querySelectorAll(selector || ".reveal");
    if (reducedMotion) {
      els.forEach((e) => e.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -60px 0px" }
    );
    els.forEach((el) => io.observe(el));
  }

  // ---------- Number count-up ----------
  function animateNumber(el, opts) {
    opts = opts || {};
    const to =
      opts.to != null ? opts.to : parseFloat(el.dataset.to || el.textContent);
    const duration = opts.duration || 1400;
    const suffix = opts.suffix || el.dataset.suffix || "";
    const decimals =
      opts.decimals != null
        ? opts.decimals
        : parseInt(el.dataset.decimals || "0", 10);
    if (reducedMotion) {
      el.textContent =
        to.toLocaleString(undefined, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }) + suffix;
      return;
    }
    const start = performance.now();
    function step(now) {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = to * eased;
      el.textContent =
        v.toLocaleString(undefined, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function countOnVisible(selector) {
    const els = document.querySelectorAll(selector);
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            animateNumber(e.target);
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    els.forEach((el) => io.observe(el));
  }

  // ---------- Magnetic button ----------
  function magnetize(el, strength) {
    if (reducedMotion) return;
    strength = strength == null ? 0.28 : strength;
    const matchesFine = window.matchMedia("(pointer: fine)").matches;
    if (!matchesFine) return;
    el.addEventListener("mousemove", (e) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      el.style.transform = `translate(${(x * strength).toFixed(2)}px, ${(
        y * strength
      ).toFixed(2)}px)`;
    });
    el.addEventListener("mouseleave", () => {
      el.style.transform = "";
    });
  }

  // ---------- 3D tilt card ----------
  function tilt(el, max) {
    if (reducedMotion) return;
    const matchesFine = window.matchMedia("(pointer: fine)").matches;
    if (!matchesFine) return;
    max = max || 8;
    el.style.transformStyle = "preserve-3d";
    el.addEventListener("mousemove", (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      const rx = (py - 0.5) * -max;
      const ry = (px - 0.5) * max;
      el.style.transform = `perspective(1100px) rotateX(${rx.toFixed(
        2
      )}deg) rotateY(${ry.toFixed(2)}deg) translateY(-6px)`;
    });
    el.addEventListener("mouseleave", () => {
      el.style.transform = "";
    });
  }

  // ---------- Flag confetti ----------
  function confetti(origin, count) {
    if (reducedMotion) return;
    count = count || 70;
    const colors = ["#0B6B3A", "#D52B1E", "#1E2B88", "#F4EBD9", "#FFD84D"];
    const layer = document.createElement("div");
    layer.style.cssText =
      "position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden";
    document.body.appendChild(layer);
    const cx = origin ? origin.x : window.innerWidth / 2;
    const cy = origin ? origin.y : window.innerHeight / 2;
    for (let i = 0; i < count; i++) {
      const p = document.createElement("span");
      const size = 6 + Math.random() * 8;
      const angle = Math.random() * Math.PI * 2;
      const dist = 160 + Math.random() * 360;
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist - 120;
      const rot = Math.random() * 720 - 360;
      p.style.cssText = `
        position:absolute;left:${cx}px;top:${cy}px;
        width:${size}px;height:${size * 0.5}px;
        background:${colors[i % colors.length]};
        transform:translate(-50%,-50%);
        border-radius:1px;
        will-change:transform,opacity;
      `;
      layer.appendChild(p);
      const dur = 900 + Math.random() * 800;
      p.animate(
        [
          { transform: `translate(-50%,-50%) rotate(0deg)`, opacity: 1 },
          {
            transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${
              dy + 360
            }px)) rotate(${rot}deg)`,
            opacity: 0,
          },
        ],
        { duration: dur, easing: "cubic-bezier(.22,.7,.3,1)", fill: "forwards" }
      );
    }
    setTimeout(() => layer.remove(), 2200);
  }

  // ---------- Copy helper ----------
  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        document.body.removeChild(ta);
        return true;
      } catch (e2) {
        document.body.removeChild(ta);
        return false;
      }
    }
  }

  global.FX = {
    whistle,
    kick,
    tick,
    crowd,
    horn,
    netRipple,
    goal,
    setEnabled,
    isEnabled,
    buzz,
    reveal,
    animateNumber,
    countOnVisible,
    magnetize,
    tilt,
    confetti,
    copy,
    reducedMotion,
  };
})(window);
