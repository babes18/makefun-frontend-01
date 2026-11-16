// Lantern router: hash routes; views load by import() after first paint.
const view = document.getElementById('view');
const fresh = document.getElementById('fresh');
let viewsP = null;
const loadViews = () => (viewsP ??= import('./views.js'));
function route() {
  window.__shotReady = false;
  const h = location.hash.replace(/^#/, '') || '/';
  requestAnimationFrame(() => loadViews().then((v) => v.route(h, view, fresh)));
}
addEventListener('hashchange', route);
route();
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const q = document.getElementById('q');
    if (q && q.value) { q.value = ''; q.dispatchEvent(new Event('input')); }
  }
});
