(() => {
  const canvas = document.getElementById("scene");
  const ctx = canvas.getContext("2d", { alpha: true });
  const runBtn = document.getElementById("run");
  const dlBtn = document.getElementById("download");
  const statusEl = document.getElementById("status");
  const countEl = document.getElementById("particles");
  const metricEls = new Map(
    Array.from(document.querySelectorAll("#metrics [data-k]")).map((el) => [
      el.dataset.k,
      el,
    ])
  );
  const rootStyles = window.getComputedStyle(document.documentElement);
  const tokenValue = (name, fallback) => rootStyles.getPropertyValue(name).trim() || fallback;
  const sourceFamily = tokenValue("--font-brand-display", "\"Cormorant Garamond\"");
  const bodyFamily = tokenValue("--font-body", "\"DM Sans\"");

  const BASE = {
    wordX: 210,
    wordY: 96,
    baselineY: 122,
    taglineY: 198,
    neckX: 370,
    neckHalfWidth: 12,
    sourceFont: `500 64px ${sourceFamily}`,
    taglineFont: `400 22px ${bodyFamily}`,
    tagline: "Un solo dettaglio. Quello carino.",
  };

  const PINK = [224, 142, 149];
  const SAGE = [167, 198, 174];

  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (a, b, x) => {
    const t = clamp((x - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  };

  function rng(seed) {
    let x = seed | 0;
    return () => {
      x ^= x << 13;
      x ^= x >> 17;
      x ^= x << 5;
      return ((x >>> 0) % 1000000) / 1000000;
    };
  }

  function percentile(values, p) {
    const sorted = [...values].sort((a, b) => a - b);
    const idx = Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * p));
    return sorted[idx] ?? 0;
  }
  function sampleText(text, font, step) {
    const off = document.createElement("canvas");
    const octx = off.getContext("2d", { willReadFrequently: true });
    octx.font = font;
    const h = Number((font.match(/(\\d+)px/) || ["", "24"])[1]) + 16;
    const w = Math.ceil(octx.measureText(text).width) + 16;
    off.width = w;
    off.height = h;
    octx.clearRect(0, 0, w, h);
    octx.fillStyle = "rgb(255 255 255)";
    octx.font = font;
    octx.textBaseline = "top";
    octx.fillText(text, 8, 8);

    const pixels = octx.getImageData(0, 0, w, h).data;
    const points = [];
    for (let y = 0; y < h; y += step) {
      for (let x = 0; x < w; x += step) {
        if (pixels[(y * w + x) * 4 + 3] > 100) points.push({ x, y });
      }
    }
    return points;
  }

  function drawBackdrop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(255,255,255,0.88)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = `500 68px ${sourceFamily}`;
    ctx.fillStyle = "rgba(63,49,51,0.88)";
    ctx.fillText("Car", BASE.wordX, BASE.wordY);
    ctx.fillText("ina", BASE.wordX + 152, BASE.wordY);

    ctx.strokeStyle = "rgba(96,82,84,0.16)";
    ctx.beginPath();
    ctx.moveTo(BASE.neckX, BASE.baselineY - 22);
    ctx.lineTo(BASE.neckX, BASE.taglineY - 12);
    ctx.stroke();

    ctx.font = BASE.taglineFont;
    ctx.fillStyle = "rgba(63,49,51,0.24)";
    ctx.fillText(BASE.tagline, BASE.wordX + 6, BASE.taglineY);
  }

  function setMetrics(metrics) {
    Object.entries(metrics).forEach(([key, value]) => {
      const el = metricEls.get(key);
      if (!el) return;
      if (typeof value !== "number") {
        el.textContent = String(value);
        return;
      }
      if (key.toLowerCase().includes("pct")) el.textContent = `${value.toFixed(1)}%`;
      else if (key.toLowerCase().includes("fps")) el.textContent = value.toFixed(1);
      else el.textContent = value.toFixed(2);
    });
  }

  let activeRun = null;
  let lastMetrics = null;
  async function runParticleBenchmark(options = {}) {
    if (activeRun) activeRun.cancelled = true;

    const particleCount = clamp(Number(options.particleCount || 500), 120, 1200);
    const random = rng((options.seed || 20260223) + particleCount);

    const source = sampleText("y", BASE.sourceFont, 2).map((p) => ({
      x: BASE.wordX + 122 + p.x,
      y: BASE.wordY + p.y,
    }));

    const target = sampleText(BASE.tagline, BASE.taglineFont, 2)
      .map((p) => ({ x: BASE.wordX + 6 + p.x, y: BASE.taglineY + p.y }))
      .sort((a, b) => a.x - b.x || a.y - b.y);

    const particles = Array.from({ length: particleCount }, (_, i) => {
      const s = source[(i * 7) % source.length];
      const t = target[i % target.length];
      return {
        x: s.x + (random() - 0.5) * 4,
        y: s.y + (random() - 0.5) * 4,
        vx: (random() - 0.5) * 18,
        vy: -random() * 15,
        tx: t.x,
        ty: t.y,
        radius: 1.3 + random() * 0.9,
      };
    });

    const cfg = { p2s: 500, p2e: 2200, p3s: 1500, p3e: 3600, end: 4200, g: 220, a: 9.8, d: 0.985 };
    const minTX = target[0]?.x ?? BASE.wordX;
    const maxTX = target[target.length - 1]?.x ?? BASE.wordX + 240;

    const frameDurations = [];
    let longFrames = 0;
    let lastTs = performance.now();
    const startTs = lastTs;

    statusEl.textContent = `Running (${particleCount})...`;
    activeRun = { cancelled: false };

    return new Promise((resolve) => {
      const step = (now) => {
        if (activeRun.cancelled) return resolve(null);

        const dt = now - lastTs;
        lastTs = now;
        const elapsed = now - startTs;
        frameDurations.push(dt);
        if (dt > 16.7) longFrames += 1;

        drawBackdrop();

        const revealX = lerp(minTX, maxTX, smooth(cfg.p3s, cfg.p3e, elapsed));
        const colorT = smooth(1000, 2800, elapsed);
        const rr = Math.round(lerp(PINK[0], SAGE[0], colorT));
        const gg = Math.round(lerp(PINK[1], SAGE[1], colorT));
        const bb = Math.round(lerp(PINK[2], SAGE[2], colorT));
        ctx.fillStyle = `rgba(${rr},${gg},${bb},0.9)`;

        const neckOpen = 26 - 14 * smooth(cfg.p2s, cfg.p2e, elapsed) + 6 * smooth(cfg.p3s, cfg.p3e, elapsed);
        for (const p of particles) {
          p.vy += cfg.g * Math.min(dt, 34) / 1000;

          if (elapsed >= cfg.p2s && elapsed <= cfg.p3e) {
            const dy = Math.abs(p.y - BASE.baselineY);
            const inf = clamp(1 - dy / 44, 0, 1);
            if (inf > 0) {
              const minX = BASE.neckX - (BASE.neckHalfWidth + neckOpen * 0.5);
              const maxX = BASE.neckX + (BASE.neckHalfWidth + neckOpen * 0.5);
              if (p.x < minX) p.vx += (minX - p.x) * 0.85;
              if (p.x > maxX) p.vx -= (p.x - maxX) * 0.85;
            }
          }

          if (elapsed >= cfg.p3s && p.tx <= revealX) {
            p.vx += (p.tx - p.x) * cfg.a * dt / 1000;
            p.vy += (p.ty - p.y) * cfg.a * dt / 1000;
          }

          p.vx *= cfg.d;
          p.vy *= cfg.d;
          p.x += p.vx * dt / 1000;
          p.y += p.vy * dt / 1000;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
        }

        if (elapsed < cfg.end) return requestAnimationFrame(step);

        const avgFrameMs = frameDurations.reduce((a, b) => a + b, 0) / frameDurations.length;
        const metrics = {
          particleCount,
          durationMs: elapsed,
          avgFrameMs,
          avgFps: 1000 / avgFrameMs,
          p95FrameMs: percentile(frameDurations, 0.95),
          maxFrameMs: Math.max(...frameDurations),
          longFramePct: (longFrames / frameDurations.length) * 100,
        };

        lastMetrics = metrics;
        window.__particleMetrics = metrics;
        setMetrics(metrics);
        statusEl.textContent = "Complete";
        resolve(metrics);
      };

      requestAnimationFrame(step);
    });
  }

  window.runParticleBenchmark = runParticleBenchmark;
  window.__particleMetrics = null;

  runBtn.addEventListener("click", () => {
    runParticleBenchmark({ particleCount: Number(countEl.value || 500) });
  });

  dlBtn.addEventListener("click", () => {
    if (!lastMetrics) return;
    const blob = new Blob([JSON.stringify(lastMetrics, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "prototype-metrics.json";
    a.click();
    URL.revokeObjectURL(a.href);
  });

  runParticleBenchmark({ particleCount: Number(countEl.value || 500) });
})();
