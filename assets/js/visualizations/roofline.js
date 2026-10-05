export function mountRoofline(host) {
  host.innerHTML = `
    <div class="viz-shell">
      <div class="viz-toolbar"><strong>Roofline model</strong></div>
      <div class="scaling-controls">
        <label>Arithmetic intensity <output data-ai>4</output><input data-air type="range" min=".25" max="32" step=".25" value="4"></label>
        <label>Memory BW (GB/s) <output data-bw>200</output><input data-bwr type="range" min="50" max="500" step="10" value="200"></label>
        <label>Peak (GF/s) <output data-pk>2000</output><input data-pkr type="range" min="500" max="5000" step="100" value="2000"></label>
      </div>
      <div class="metric-grid">
        <div><span>Bound</span><strong data-bound></strong></div>
        <div><span>Ceiling</span><strong data-ceil></strong></div>
        <div><span>Ridge point</span><strong data-ridge></strong></div>
      </div>
    </div>`;
  const ai = host.querySelector("[data-air]"), bw = host.querySelector("[data-bwr]"), pk = host.querySelector("[data-pkr]");
  function update() {
    const A = +ai.value, B = +bw.value, P = +pk.value, perf = Math.min(P, A * B);
    host.querySelector("[data-ai]").value = A;
    host.querySelector("[data-bw]").value = B;
    host.querySelector("[data-pk]").value = P;
    host.querySelector("[data-bound]").textContent = A * B < P ? "Memory" : "Compute";
    host.querySelector("[data-ceil]").textContent = `${perf.toFixed(0)} GF/s`;
    host.querySelector("[data-ridge]").textContent = `${(P / B).toFixed(2)} FLOP/B`;
  }
  [ai, bw, pk].forEach(input => input.addEventListener("input", update));
  update();
  return () => [ai, bw, pk].forEach(input => input.removeEventListener("input", update));
}
