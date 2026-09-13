import { applyThemeMode, createSystemThemeListener, loadPreferences } from './shared/preferences.js';

const { themeMode } = loadPreferences();
applyThemeMode(themeMode);
if (themeMode === 'system') {
  createSystemThemeListener(() => applyThemeMode('system'));
}
