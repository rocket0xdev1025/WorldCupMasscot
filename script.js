/* ======================================================
   v2 — Matchday Poster v2.1
   ====================================================== */

(function () {
  const FX = window.FX;

  // ---------- Reveal ----------
  FX.reveal(".reveal");

  // ---------- Safety net: force-show any stuck reveal after 2s ----------
  setTimeout(() => {
    document
      .querySelectorAll(".reveal:not(.in)")
      .forEach((el) => el.classList.add("in"));
  }, 2000);

  // ---------- Counters ----------
  FX.countOnVisible(".count");

  // ---------- Progress bars ----------
  const barIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const pct = parseInt(e.target.dataset.fill || "0", 10);
          e.target.style.width = pct + "%";
          barIO.unobserve(e.target);
        }
      });
    },
    { threshold: 0.4 }
  );
  document.querySelectorAll(".bar > i[data-fill]").forEach((el) => {
    el.style.width = "0%";
    barIO.observe(el);
  });

  // ---------- Card tilt ----------
  document.querySelectorAll("[data-tilt]").forEach((el) => FX.tilt(el, 6));

  // ---------- Memes gallery ----------
  const MEMES = [
    {
      f: "01-meet-the-mascots",
      caption: "Meet the official 2026 mascots",
      feature: true,
    },
  ];
  for (let i = 2; i <= 34; i++) {
    const n = String(i).padStart(2, "0");
    MEMES.push({ f: `${n}-meme`, caption: `Meme № ${n}` });
  }

  const grid = document.getElementById("memes-grid");
  if (grid) {
    // Clear skeletons, build real tiles via DOM API (mobile-robust)
    grid.innerHTML = "";
    const frag = document.createDocumentFragment();
    MEMES.forEach((m, i) => {
      const a = document.createElement("a");
      a.className = "meme-tile loading" + (m.feature ? " feature" : "");
      a.href = `Assets/memes/full/${m.f}.webp`;
      a.dataset.idx = i;
      a.setAttribute("role", "listitem");
      a.setAttribute("aria-label", m.caption);

      const img = document.createElement("img");
      img.alt = m.caption;
      img.decoding = "async";
      // Tiered loading: first 8 eager (above-fold on most viewports), rest lazy
      img.loading = i < 8 ? "eager" : "lazy";
      if (i < 4) img.setAttribute("fetchpriority", "high");
      img.addEventListener("load", () => {
        a.classList.remove("loading");
        a.classList.add("loaded");
      });
      img.addEventListener("error", () => {
        a.classList.remove("loading");
        a.classList.add("failed");
        // Fallback: try JPG once
        if (!img.dataset.fallback) {
          img.dataset.fallback = "1";
          img.src = `Assets/memes/thumb/${m.f}.jpg`;
          a.classList.remove("failed");
        }
      });
      img.src = `Assets/memes/thumb/${m.f}.webp`;
      a.appendChild(img);

      const idx = document.createElement("span");
      idx.className = "idx";
      idx.textContent = String(i + 1).padStart(2, "0");
      a.appendChild(idx);

      frag.appendChild(a);
    });
    grid.appendChild(frag);

    // Lightbox
    const lb = document.getElementById("lightbox");
    const lbIm = document.getElementById("lb-img");
    const lbCp = document.getElementById("lb-cap");
    const lbX = document.getElementById("lb-close");
    const lbP = document.getElementById("lb-prev");
    const lbN = document.getElementById("lb-next");
    let lbIndex = 0;

    // Feature-test WebP once
    const webpOK = (() => {
      const c = document.createElement("canvas");
      c.width = c.height = 1;
      try {
        return c.toDataURL("image/webp").indexOf("image/webp") === 5;
      } catch (e) {
        return false;
      }
    })();

    function openLB(i) {
      lbIndex = (i + MEMES.length) % MEMES.length;
      const m = MEMES[lbIndex];
      const ext = webpOK ? "webp" : "jpg";
      lbIm.src = `Assets/memes/full/${m.f}.${ext}`;
      lbIm.alt = m.caption;
      lbCp.textContent = `${String(lbIndex + 1).padStart(2, "0")} / ${
        MEMES.length
      } · ${m.caption}`;
      lb.classList.add("open");
      lb.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    }
    function closeLB() {
      lb.classList.remove("open");
      lb.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      lbIm.src = "";
    }
    function next(step) {
      openLB(lbIndex + step);
      FX.tick();
      FX.buzz([8]);
    }

    grid.addEventListener("click", (e) => {
      const tile = e.target.closest(".meme-tile");
      if (!tile) return;
      e.preventDefault();
      openLB(parseInt(tile.dataset.idx, 10));
      FX.netRipple();
      FX.buzz([10]);
    });

    lbX.addEventListener("click", () => {
      closeLB();
      FX.tick();
    });
    lbP.addEventListener("click", () => next(-1));
    lbN.addEventListener("click", () => next(1));

    // click backdrop to close
    lb.addEventListener("click", (e) => {
      if (e.target === lb) closeLB();
    });

    // keyboard
    document.addEventListener("keydown", (e) => {
      if (!lb.classList.contains("open")) return;
      if (e.key === "Escape") closeLB();
      if (e.key === "ArrowLeft") next(-1);
      if (e.key === "ArrowRight") next(1);
    });

    // swipe (basic)
    let touchX = null;
    lb.addEventListener(
      "touchstart",
      (e) => {
        touchX = e.touches[0].clientX;
      },
      { passive: true }
    );
    lb.addEventListener("touchend", (e) => {
      if (touchX == null) return;
      const dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 50) next(dx < 0 ? 1 : -1);
      touchX = null;
    });
  }

  // ---------- Confetti rain (hero + final CTA + footer) ----------
  function seedRain(container, count) {
    if (!container || FX.reducedMotion) return;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const s = document.createElement("i");
      s.style.left = (Math.random() * 100).toFixed(2) + "%";
      s.style.animationDuration = (5 + Math.random() * 6).toFixed(2) + "s";
      s.style.animationDelay = (-Math.random() * 8).toFixed(2) + "s";
      s.style.opacity = (0.35 + Math.random() * 0.4).toFixed(2);
      s.style.transform = `rotate(${Math.floor(Math.random() * 360)}deg)`;
      frag.appendChild(s);
    }
    container.appendChild(frag);
  }
  seedRain(document.getElementById("confetti-rain"), 28);
  seedRain(document.getElementById("final-confetti"), 36);
  seedRain(document.getElementById("foot-confetti"), 22);

  // ---------- Toast ----------
  const toast = document.getElementById("toast");
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove("show"), 1600);
  }

  // ---------- CA copy ----------
  document.querySelectorAll(".ca-copy").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const target = document.getElementById(btn.dataset.copy);
      if (!target) return;
      const ok = await FX.copy(target.textContent.trim());
      if (ok) {
        FX.netRipple();
        FX.buzz([10, 25, 10]);
        showToast("Contract copied");
      } else {
        showToast("Copy blocked — select manually");
      }
    });
  });

  // ---------- SFX + haptics dispatch ----------
  const sfxMap = {
    whistle: () => FX.whistle(),
    kick: () => FX.kick(),
    horn: () => FX.horn(),
    crowd: () => FX.crowd(1.2),
    goal: () => FX.goal(),
    ripple: () => FX.netRipple(),
    tick: () => FX.tick(),
  };
  const hapticMap = {
    light: [10],
    strong: [20, 30, 20],
    celebrate: [30, 40, 30, 40, 60],
  };

  document.querySelectorAll("[data-sfx]").forEach((el) => {
    el.addEventListener("click", () => {
      const s = el.dataset.sfx;
      if (s && sfxMap[s]) sfxMap[s]();
      const h = el.dataset.haptic;
      if (h && hapticMap[h]) FX.buzz(hapticMap[h]);
      if (el.hasAttribute("data-confetti")) {
        const r = el.getBoundingClientRect();
        FX.confetti({ x: r.left + r.width / 2, y: r.top + r.height / 2 }, 90);
      }
    });
    el.addEventListener("mouseenter", () => {
      const s = el.dataset.sfx;
      if (s === "whistle" || s === "goal") FX.tick();
    });
  });

  // ---------- Sound toggle ----------
  const soundBtn = document.getElementById("sound-toggle");
  function syncSoundBtn() {
    const on = FX.isEnabled();
    soundBtn.setAttribute("aria-pressed", on ? "true" : "false");
    soundBtn.querySelector("span").textContent = on ? "Sound" : "Muted";
  }
  syncSoundBtn();
  soundBtn.addEventListener("click", () => {
    FX.setEnabled(!FX.isEnabled());
    syncSoundBtn();
    if (FX.isEnabled()) FX.tick();
  });

  // ---------- Active nav ----------
  const ids = ["home", "squad", "tokenomics", "chart", "buy", "memes"];
  const links = document.querySelectorAll(".menu a");
  const spy = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const id = e.target.id;
          links.forEach((a) =>
            a.classList.toggle("active", a.getAttribute("href") === "#" + id)
          );
        }
      });
    },
    { threshold: 0.4 }
  );
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (el) spy.observe(el);
  });

  // ---------- Crowd swell at tokenomics ----------
  const tok = document.getElementById("tokenomics");
  if (tok) {
    const crowdIo = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            FX.crowd(1.6);
            crowdIo.disconnect();
          }
        });
      },
      { threshold: 0.35 }
    );
    crowdIo.observe(tok);
  }
})();

/* ============ THEMED VIDEO PLAYER (reusable) ============ */
function initThemedPlayer(wrap) {
  if (!wrap) return;
  const frame = wrap.querySelector(".pv-frame");
  const v = wrap.querySelector(".pv-media");
  if (!frame || !v) return;
  const big = wrap.querySelector(".pv-bigplay");
  const play = wrap.querySelector(".pv-play");
  const mute = wrap.querySelector(".pv-mute");
  const fs = wrap.querySelector(".pv-fs");
  const seek = wrap.querySelector(".pv-seek");
  const fill = wrap.querySelector(".pv-fill");
  const cur = wrap.querySelector(".pv-cur");
  const dur = wrap.querySelector(".pv-dur");
  const fmt = (s) => {
    if (!isFinite(s) || s < 0) s = 0;
    const m = Math.floor(s / 60),
      r = Math.floor(s % 60);
    return m + ":" + (r < 10 ? "0" : "") + r;
  };
  const setPlaying = (p) => frame.classList.toggle("is-playing", p);
  const setPaused = (p) => frame.classList.toggle("is-paused", p);
  const setMuted = (m) => {
    frame.classList.toggle("is-muted", m);
    if (mute) mute.setAttribute("aria-pressed", m ? "true" : "false");
  };
  setPaused(true);
  setMuted(v.muted);

  const toggle = () => {
    v.paused ? v.play().catch(() => {}) : v.pause();
  };

  big && big.addEventListener("click", toggle);
  play && play.addEventListener("click", toggle);
  v.addEventListener("click", toggle);

  v.addEventListener("play", () => {
    setPlaying(true);
    setPaused(false);
  });
  v.addEventListener("pause", () => {
    setPlaying(false);
    setPaused(true);
  });
  v.addEventListener("ended", () => {
    setPlaying(false);
    setPaused(true);
    try {
      v.currentTime = 0;
    } catch (e) {}
  });

  v.addEventListener("loadedmetadata", () => {
    if (dur && isFinite(v.duration)) dur.textContent = fmt(v.duration);
  });
  v.addEventListener("timeupdate", () => {
    const d = v.duration || 0;
    const t = v.currentTime || 0;
    const pct = d > 0 ? (t / d) * 100 : 0;
    if (fill) fill.style.width = pct + "%";
    if (seek && document.activeElement !== seek)
      seek.value = Math.round(pct * 10);
    if (cur) cur.textContent = fmt(t);
  });

  seek &&
    seek.addEventListener("input", () => {
      const d = v.duration || 0;
      if (d > 0) {
        const pct = Number(seek.value) / 1000;
        v.currentTime = d * pct;
        if (fill) fill.style.width = pct * 100 + "%";
      }
    });

  mute &&
    mute.addEventListener("click", () => {
      v.muted = !v.muted;
      setMuted(v.muted);
    });

  fs &&
    fs.addEventListener("click", () => {
      const anyDoc = document;
      if (anyDoc.fullscreenElement || anyDoc.webkitFullscreenElement) {
        (anyDoc.exitFullscreen || anyDoc.webkitExitFullscreen).call(anyDoc);
      } else {
        const el = frame;
        (
          el.requestFullscreen ||
          el.webkitRequestFullscreen ||
          el.webkitEnterFullscreen
        ).call(el);
      }
    });

  // Keyboard controls when the frame is focused
  frame.tabIndex = 0;
  frame.addEventListener("focus", () => frame.classList.add("is-focus"));
  frame.addEventListener("blur", () => frame.classList.remove("is-focus"));
  frame.addEventListener("keydown", (e) => {
    switch (e.key) {
      case " ":
      case "k":
        e.preventDefault();
        toggle();
        break;
      case "m":
        e.preventDefault();
        v.muted = !v.muted;
        setMuted(v.muted);
        break;
      case "f":
        e.preventDefault();
        fs && fs.click();
        break;
      case "ArrowLeft":
        e.preventDefault();
        v.currentTime = Math.max(0, v.currentTime - 5);
        break;
      case "ArrowRight":
        e.preventDefault();
        v.currentTime = Math.min(v.duration || 0, v.currentTime + 5);
        break;
    }
  });

  // Auto-pause when scrolled out of view
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting && !v.paused) v.pause();
      });
    },
    { threshold: 0.1 }
  );
  io.observe(frame);
}

document.querySelectorAll(".pv-wrap").forEach(initThemedPlayer);
