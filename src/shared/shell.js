import { initI18n } from './i18n.js';
initI18n();
import { applyThemeMode, createSystemThemeListener, loadPreferences, saveThemeModePreference } from './preferences.js';
const selector = document.querySelector('#theme-mode');
let { themeMode } = loadPreferences();
applyThemeMode(themeMode);
if (selector) {
  selector.value = themeMode;
  selector.addEventListener('change', () => { themeMode = selector.value; saveThemeModePreference(themeMode); applyThemeMode(themeMode); });
}
const detach = createSystemThemeListener(() => { if (themeMode === 'system') applyThemeMode(themeMode); });
window.addEventListener('pagehide', detach, { once: true });
