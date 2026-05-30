'use client';

import { useEffect, useRef } from 'react';
import { useThemeStore } from '@/stores/theme-store';

/**
 * ThemeInitializer — applies saved custom theme on app mount.
 * Placed inside ThemeProvider so it can read the .dark class.
 */
export function ThemeInitializer() {
  const applyTheme = useThemeStore((s) => s.applyTheme);
  const applied = useRef(false);

  // Apply on first mount
  useEffect(() => {
    if (!applied.current) {
      applied.current = true;
      // Small delay to ensure ThemeProvider has set the .dark class
      setTimeout(() => applyTheme(), 100);
    }
  }, [applyTheme]);

  // Watch for class changes (light/dark toggle)
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setTimeout(() => applyTheme(), 50);
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, [applyTheme]);

  return null;
}
