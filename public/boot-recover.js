/**
 * Limer's Capital — Boot-Stuck Recovery
 *
 * Extracted from inline `<script>` in index.html (audit C-03 Phase 1 remediation,
 * April 2026) so a hardened Content-Security-Policy can eventually drop
 * `'unsafe-inline'` from `script-src`.
 *
 * Responsibilities:
 *   1. If React has not replaced #root's contents within STUCK_MS, surface a
 *      recovery UI so a user holding a stale service-worker cache can recover.
 *   2. When the user clicks "Clear cache & reload", unregister all service
 *      workers, purge Cache Storage, clear localStorage + sessionStorage, then
 *      reload at /?reset=1 so any future hydration can branch on the query.
 *
 * Runs at end of <body>. DOM is ready when this executes — no DOMContentLoaded
 * wrapper needed.
 *
 * Do NOT edit the visible copy without updating the matching <noscript> /
 * #boot-fallback markup in index.html.
 */

(function () {
  // If React hasn't replaced #root's contents within 8s, surface a recovery UI.
  var STUCK_MS = 8000;
  var timer = setTimeout(function () {
    var stuck = document.getElementById('boot-stuck');
    var spinner = document.getElementById('boot-spinner');
    if (stuck) stuck.style.display = 'block';
    if (spinner) spinner.style.display = 'none';
  }, STUCK_MS);

  // When React mounts, it swaps #root's children — detect via MutationObserver
  // on #root and clear the timer as soon as a non-fallback child appears.
  var root = document.getElementById('root');
  if (root && typeof MutationObserver === 'function') {
    var mo = new MutationObserver(function () {
      if (!document.getElementById('boot-fallback')) {
        clearTimeout(timer);
        mo.disconnect();
      }
    });
    mo.observe(root, { childList: true, subtree: false });
  }

  // Wire up the recovery button: unregister SWs, clear caches + storage, reload.
  document.addEventListener('click', function (e) {
    if (!e.target || e.target.id !== 'boot-recover') return;
    e.target.textContent = 'Clearing…';
    e.target.disabled = true;
    var done = function () { window.location.replace('/?reset=1'); };
    var tasks = [];
    try {
      if ('serviceWorker' in navigator) {
        tasks.push(navigator.serviceWorker.getRegistrations().then(function (rs) {
          return Promise.all(rs.map(function (r) { return r.unregister(); }));
        }));
      }
      if (typeof caches !== 'undefined' && caches.keys) {
        tasks.push(caches.keys().then(function (ks) {
          return Promise.all(ks.map(function (k) { return caches.delete(k); }));
        }));
      }
      try { localStorage.clear(); } catch (_) {}
      try { sessionStorage.clear(); } catch (_) {}
    } catch (_) {}
    Promise.all(tasks).then(done, done);
    setTimeout(done, 3000);
  });
})();
