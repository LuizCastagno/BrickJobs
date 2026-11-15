export type ThemeMode = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'brickjobs_theme_v1';

interface RootElementLike {
  classList: {
    toggle: (token: string, force?: boolean) => unknown;
  };
  style?: {
    colorScheme?: string;
  };
}

export function loadThemePreference(
  storage?: Pick<Storage, 'getItem'> | null
): ThemeMode {
  const target =
    storage !== undefined
      ? storage
      : typeof window !== 'undefined'
        ? window.localStorage
        : null;

  if (!target) return 'light';

  try {
    const saved = target.getItem(THEME_STORAGE_KEY);
    return saved === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function saveThemePreference(
  theme: ThemeMode,
  storage?: Pick<Storage, 'setItem'> | null
): void {
  const target =
    storage !== undefined
      ? storage
      : typeof window !== 'undefined'
        ? window.localStorage
        : null;

  if (!target) return;

  try {
    target.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Ignore storage quota or privacy-mode errors cleanly
  }
}

export function applyThemeToDocument(
  theme: ThemeMode,
  rootEl?: RootElementLike | null
): void {
  const target =
    rootEl !== undefined
      ? rootEl
      : typeof document !== 'undefined'
        ? document.documentElement
        : null;

  if (!target) return;

  target.classList.toggle('dark', theme === 'dark');
  if (target.style) {
    target.style.colorScheme = theme;
  }

  if (rootEl === undefined && typeof document !== 'undefined') {
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', theme === 'dark' ? '#111827' : '#ffffff');
    }
  }
}

export function toggleThemeMode(current: ThemeMode): ThemeMode {
  return current === 'dark' ? 'light' : 'dark';
}
