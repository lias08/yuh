import './styles.css';
import { App } from './ui/app.js';
import { Save, newBrawler } from './core/save.js';

function boot() {
  try {
    const app = new App();
    window.__app = app;
    window.__save = { Save, newBrawler }; // debug / automated tests
    document.getElementById('boot')?.remove();
  } catch (e) {
    console.error(e);
    const b = document.getElementById('boot');
    if (b) b.innerHTML = `<div class="boot-err"><b>Start fehlgeschlagen</b><p>${String(e.message || e)}</p><p>WebGL wird benötigt.</p></div>`;
  }
}
boot();
