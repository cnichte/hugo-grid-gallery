// assets/js/theme-switcher.js

  { {/* Theme Registry */ } }
  { {/* ! Theming: 3. Neues Theme registrieren. Fertig! */ } }
  { {/* Icons: https://tablericons.com/category/Weather */ } }
  const THEMES = [
    { name: 'theme--day', icon: '<svg class="svg" data-bs-theme-value="light" class="icon icon-tabler icon-tabler-sun" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentcolor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M12 12m-4 0a4 4 0 108 0 4 4 0 10-8 0m-5 0h1m8-9v1m8 8h1m-9 8v1M5.6 5.6l.7.7m12.1-.7-.7.7m0 11.4.7.7m-12.1-.7-.7.7"></path></svg>' },
    { name: 'theme--sunset', icon: '<svg class="svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" width="24" height="24" stroke-width="2"><path d="M3 12h1"></path><path d="M12 3v1"></path><path d="M20 12h1"></path><path d="M5.6 5.6l.7 .7"></path><path d="M18.4 5.6l-.7 .7"></path><path d="M8 12a4 4 0 1 1 8 0"></path><path d="M3 16h18"></path><path d="M3 20h18"></path></svg>' },
    { name: 'theme--evening', icon: '<svg class="svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" width="24" height="24" stroke-width="2"><path d="M3 17h1m16 0h1m-15.4 -6.4l.7 .7m12.1 -.7l-.7 .7m-9.7 5.7a4 4 0 0 1 8 0"></path><path d="M3 21l18 0"></path><path d="M12 3v6l3 -3m-6 0l3 3"></path></svg>' },
    { name: 'theme--night', icon: '<svg class="svg" data-bs-theme-value="dark" class="icon icon-tabler icon-tabler-moon" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentcolor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M12 3c.132.0.263.0.393.0a7.5 7.5.0 007.92 12.446A9 9 0 1112 2.992z"></path></svg>' }];


function setThemeClasses(theme) {
  const body = document.body;
  THEMES.forEach(t => body.classList.remove(t.name));
  body.classList.add(theme);
  document.documentElement.className = theme; // wichtig
}

function toggleThemeButton(theme) {
  const container = document.getElementById("theme-switch");
  if (!container) return;

  container.replaceChildren();
  const currentIndex = THEMES.findIndex(t => t.name === theme);
  const next = THEMES[(currentIndex + 1) % THEMES.length];
  container.innerHTML = next.icon;
}

function toggleTheme() {
  const current = localStorage.getItem('BinaryVoids_Theme');
  const index = THEMES.findIndex(t => t.name === current);
  const next = THEMES[(index + 1) % THEMES.length].name;
  setThemeClasses(next);
  toggleThemeButton(next);
  localStorage.setItem('BinaryVoids_Theme', next);
}

function initThemeSwitcher() {
  document.addEventListener("DOMContentLoaded", () => {
    const saved = localStorage.getItem('BinaryVoids_Theme') || THEMES[0].name;
    setThemeClasses(saved);
    toggleThemeButton(saved);
    localStorage.setItem('BinaryVoids_Theme', saved);
  });
}

// 🟢 Globale Verfügbarkeit sicherstellen
window.toggleTheme = toggleTheme;
window.initThemeSwitcher = initThemeSwitcher;
window.toggleTheme = toggleTheme; // wichtig für onclick im HTML
// Optional: direkt initialisieren
initThemeSwitcher();