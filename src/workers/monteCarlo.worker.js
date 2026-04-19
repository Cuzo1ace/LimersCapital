/**
 * Monte Carlo price-path simulator (GBM).
 *
 * Receives { symbol, startPrice, mu, sigma, horizonDays, numPaths } and
 * streams back a Float32Array of length (numPaths * horizonDays) via a
 * transferable postMessage.
 *
 * Runs off the main thread so UI stays responsive for 1k–5k paths.
 */

// Box-Muller → standard normal (cached pair).
let _spare = null;
function randn() {
  if (_spare !== null) { const v = _spare; _spare = null; return v; }
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const mag = Math.sqrt(-2 * Math.log(u));
  const z0  = mag * Math.cos(2 * Math.PI * v);
  _spare    = mag * Math.sin(2 * Math.PI * v);
  return z0;
}

function runGbm({ startPrice, mu, sigma, horizonDays, numPaths }) {
  const steps = Math.max(2,  Math.floor(horizonDays));
  const paths = Math.max(10, Math.floor(numPaths));
  const dt = 1 / 252;              // daily steps over a trading year
  const drift = (mu - 0.5 * sigma * sigma) * dt;
  const volStep = sigma * Math.sqrt(dt);

  const out = new Float32Array(paths * steps);
  for (let p = 0; p < paths; p++) {
    let price = startPrice;
    const base = p * steps;
    out[base] = price;
    for (let t = 1; t < steps; t++) {
      const z = randn();
      price = price * Math.exp(drift + volStep * z);
      out[base + t] = price;
    }
  }

  // Per-timestep quantiles (P5 / P50 / P95).
  const q = { p5: new Float32Array(steps), p50: new Float32Array(steps), p95: new Float32Array(steps) };
  const col = new Float32Array(paths);
  for (let t = 0; t < steps; t++) {
    for (let p = 0; p < paths; p++) col[p] = out[p * steps + t];
    col.sort();
    q.p5[t]  = col[Math.floor(paths * 0.05)];
    q.p50[t] = col[Math.floor(paths * 0.50)];
    q.p95[t] = col[Math.floor(paths * 0.95)];
  }

  // Final distribution summary.
  const finals = new Float32Array(paths);
  for (let p = 0; p < paths; p++) finals[p] = out[p * steps + (steps - 1)];
  finals.sort();
  const summary = {
    mean:   finals.reduce((s, v) => s + v, 0) / paths,
    p5:     finals[Math.floor(paths * 0.05)],
    p50:    finals[Math.floor(paths * 0.50)],
    p95:    finals[Math.floor(paths * 0.95)],
    min:    finals[0],
    max:    finals[paths - 1],
    startPrice,
  };

  return { paths: out, steps, numPaths: paths, q, summary };
}

self.onmessage = (e) => {
  try {
    const t0 = Date.now();
    const res = runGbm(e.data);
    const duration = Date.now() - t0;
    self.postMessage(
      { ok: true, duration, ...res },
      // Transfer underlying buffers so the main thread receives them
      // without a copy. Owner is reassigned; worker can't use them again.
      [res.paths.buffer, res.q.p5.buffer, res.q.p50.buffer, res.q.p95.buffer]
    );
  } catch (err) {
    self.postMessage({ ok: false, error: err?.message || String(err) });
  }
};
