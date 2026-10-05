function css(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function fitCanvas(canvas) {
  const ctx = canvas.getContext("2d");
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(devicePixelRatio, 2);
  const width = Math.max(1, Math.round(rect.width * dpr));
  const height = Math.max(1, Math.round(rect.height * dpr));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w: rect.width, h: rect.height };
}

function roundRect(ctx, x, y, w, h, radius = 7, fill = null, stroke = null) {
  ctx.beginPath();
  ctx.roundRect(x, y, Math.max(0, w), Math.max(0, h), radius);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); }
}

function label(ctx, value, x, y, options = {}) {
  const {
    size = 13,
    weight = 600,
    color = css("--viewer-text"),
    align = "center",
    baseline = "middle",
    maxWidth = null
  } = options;
  ctx.save();
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  let px = size;
  ctx.font = `${weight} ${px}px system-ui`;
  if (maxWidth) {
    while (px > 9 && ctx.measureText(value).width > maxWidth) {
      px -= 0.5;
      ctx.font = `${weight} ${px}px system-ui`;
    }
  }
  ctx.fillText(value, x, y, maxWidth || undefined);
  ctx.restore();
}

function box(ctx, x, y, w, h, text, options = {}) {
  const {
    accent = false,
    fill = accent ? css("--viz-accent-bg") : css("--viz-node"),
    stroke = accent ? css("--accent") : css("--viewer-line"),
    textColor = css("--viewer-text"),
    size = 13
  } = options;
  ctx.lineWidth = 1;
  roundRect(ctx, x, y, w, h, 7, fill, stroke);
  label(ctx, text, x + w / 2, y + h / 2, { size, color: textColor, maxWidth: Math.max(8, w - 12) });
}

function line(ctx, x1, y1, x2, y2, color = css("--viewer-line"), width = 2, dashed = false) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  if (dashed) ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

function arrow(ctx, x1, y1, x2, y2, color = css("--accent"), width = 2) {
  line(ctx, x1, y1, x2, y2, color, width);
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const size = 7;
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - Math.cos(angle - Math.PI / 6) * size, y2 - Math.sin(angle - Math.PI / 6) * size);
  ctx.lineTo(x2 - Math.cos(angle + Math.PI / 6) * size, y2 - Math.sin(angle + Math.PI / 6) * size);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function particle(ctx, a, b, t, color) {
  const p = ((t % 1) + 1) % 1;
  const x = a.x + (b.x - a.x) * p;
  const y = a.y + (b.y - a.y) * p;
  ctx.beginPath();
  ctx.fillStyle = color;
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fill();
}

function createLoop(canvas, draw) {
  let raf = 0;
  let alive = true;
  let dirty = true;
  const ro = new ResizeObserver(() => { dirty = true; });
  ro.observe(canvas);
  const themeObserver = new MutationObserver(() => { dirty = true; });
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  function frame(time) {
    if (!alive) return;
    const { ctx, w, h } = fitCanvas(canvas);
    draw(ctx, w, h, time / 1000, dirty);
    dirty = false;
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => {
    alive = false;
    cancelAnimationFrame(raf);
    ro.disconnect();
    themeObserver.disconnect();
  };
}

function viewerShell(host, title, buttons, detail) {
  host.innerHTML = `
    <div class="viz-shell textbook-viz">
      <div class="viz-toolbar">
        <strong>${title}</strong>
        <div class="viz-controls">${buttons || ""}</div>
      </div>
      <div class="viz-layout">
        <div class="canvas-stage textbook"><canvas></canvas></div>
        <aside class="viz-explain" aria-live="polite">
          <h3 data-viz-title></h3>
          <p data-viz-body></p>
          <dl data-viz-rows></dl>
          <div class="viz-note" data-viz-note></div>
        </aside>
      </div>
    </div>`;
  setDetails(host, detail);
  return {
    canvas: host.querySelector("canvas"),
    controls: host.querySelector(".viz-controls")
  };
}

function setDetails(host, detail) {
  host.querySelector("[data-viz-title]").textContent = detail.title || "";
  host.querySelector("[data-viz-body]").textContent = detail.body || "";
  host.querySelector("[data-viz-rows]").innerHTML = (detail.rows || []).map(row => `
    <div><dt>${row[0]}</dt><dd>${row[1]}</dd></div>`).join("");
  const note = host.querySelector("[data-viz-note]");
  note.textContent = detail.note || "";
  note.hidden = !detail.note;
}

function activateButton(controls, selector, value) {
  controls.querySelectorAll(selector).forEach(button => {
    const key = button.dataset.view ?? button.dataset.mode ?? button.dataset.step ?? button.dataset.level;
    button.classList.toggle("active", String(key) === String(value));
  });
}

export { css, fitCanvas, roundRect, label, box, line, arrow, particle, createLoop, viewerShell, setDetails, activateButton };
