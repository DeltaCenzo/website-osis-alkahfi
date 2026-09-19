import { useCallback, useEffect, useState } from 'react';

const THEME_KEY = 'theme';

function getInitialTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

function applyTheme(theme) {
  const root = document.documentElement;
  root.classList.remove('dark');
  if (theme === 'dark') {
    document.body.setAttribute('data-theme', 'dark');
    root.classList.add('dark');
  } else {
    document.body.removeAttribute('data-theme');
  }
  root.style.colorScheme = theme;

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#020817' : '#07152f');
  const appleMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
  if (appleMeta) appleMeta.setAttribute('content', theme === 'dark' ? 'black-translucent' : 'black-translucent');

  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {}
}

export function useTheme() {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, toggle };
}
