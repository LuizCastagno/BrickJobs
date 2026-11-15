import test from 'node:test';
import assert from 'node:assert/strict';
import {
  THEME_STORAGE_KEY,
  applyThemeToDocument,
  loadThemePreference,
  saveThemePreference,
  toggleThemeMode,
} from './theme';

test('loadThemePreference defaults to light and reads persisted dark/light values', () => {
  const store = new Map<string, string>();
  const mockStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => {
      store.set(k, v);
    },
  };

  assert.equal(loadThemePreference(mockStorage), 'light');
  saveThemePreference('dark', mockStorage);
  assert.equal(store.get(THEME_STORAGE_KEY), 'dark');
  assert.equal(loadThemePreference(mockStorage), 'dark');

  saveThemePreference('light', mockStorage);
  assert.equal(loadThemePreference(mockStorage), 'light');

  // Unknown value falls back to light
  store.set(THEME_STORAGE_KEY, 'invalid-value');
  assert.equal(loadThemePreference(mockStorage), 'light');
});

test('applyThemeToDocument toggles dark class and colorScheme accurately', () => {
  const classes = new Set<string>();
  const mockRoot = {
    classList: {
      toggle: (token: string, force?: boolean) => {
        if (force === true) classes.add(token);
        else if (force === false) classes.delete(token);
        else if (classes.has(token)) classes.delete(token);
        else classes.add(token);
      },
    },
    style: { colorScheme: '' },
  };

  applyThemeToDocument('dark', mockRoot);
  assert.equal(classes.has('dark'), true);
  assert.equal(mockRoot.style.colorScheme, 'dark');

  applyThemeToDocument('light', mockRoot);
  assert.equal(classes.has('dark'), false);
  assert.equal(mockRoot.style.colorScheme, 'light');
});

test('toggleThemeMode switches between light and dark', () => {
  assert.equal(toggleThemeMode('light'), 'dark');
  assert.equal(toggleThemeMode('dark'), 'light');
});
