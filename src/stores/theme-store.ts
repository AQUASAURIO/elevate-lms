import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark' | 'system';
export type BackgroundStyle = 'default' | 'dark' | 'warm' | 'cool' | 'custom';
export type ColorPreset = 'brand' | 'ocean' | 'forest' | 'sunset' | 'royal' | 'custom';

interface ColorPresetConfig {
  name: string;
  primary: string;
  primaryForeground: string;
  accent: string;
  ring: string;
  secondary: string;
  secondaryForeground: string;
}

export const COLOR_PRESETS: Record<ColorPreset, ColorPresetConfig> = {
  brand: {
    name: 'Elévate Brand',
    primary: 'oklch(0.49 0.15 250)',
    primaryForeground: 'oklch(0.985 0 0)',
    accent: 'oklch(0.95 0.03 240)',
    ring: 'oklch(0.49 0.15 250)',
    secondary: 'oklch(0.95 0.02 240)',
    secondaryForeground: 'oklch(0.28 0.10 255)',
  },
  ocean: {
    name: 'Ocean',
    primary: 'oklch(0.52 0.14 230)',
    primaryForeground: 'oklch(0.985 0 0)',
    accent: 'oklch(0.95 0.04 220)',
    ring: 'oklch(0.52 0.14 230)',
    secondary: 'oklch(0.94 0.03 225)',
    secondaryForeground: 'oklch(0.25 0.08 240)',
  },
  forest: {
    name: 'Forest',
    primary: 'oklch(0.50 0.12 145)',
    primaryForeground: 'oklch(0.985 0 0)',
    accent: 'oklch(0.95 0.03 150)',
    ring: 'oklch(0.50 0.12 145)',
    secondary: 'oklch(0.95 0.02 148)',
    secondaryForeground: 'oklch(0.22 0.08 155)',
  },
  sunset: {
    name: 'Sunset',
    primary: 'oklch(0.55 0.18 40)',
    primaryForeground: 'oklch(0.985 0 0)',
    accent: 'oklch(0.95 0.04 50)',
    ring: 'oklch(0.55 0.18 40)',
    secondary: 'oklch(0.95 0.03 45)',
    secondaryForeground: 'oklch(0.25 0.08 35)',
  },
  royal: {
    name: 'Royal',
    primary: 'oklch(0.45 0.20 300)',
    primaryForeground: 'oklch(0.985 0 0)',
    accent: 'oklch(0.95 0.04 290)',
    ring: 'oklch(0.45 0.20 300)',
    secondary: 'oklch(0.95 0.03 295)',
    secondaryForeground: 'oklch(0.20 0.06 310)',
  },
  custom: {
    name: 'Custom',
    primary: 'oklch(0.49 0.15 250)',
    primaryForeground: 'oklch(0.985 0 0)',
    accent: 'oklch(0.95 0.03 240)',
    ring: 'oklch(0.49 0.15 250)',
    secondary: 'oklch(0.95 0.02 240)',
    secondaryForeground: 'oklch(0.28 0.10 255)',
  },
};

export const BG_STYLES: Record<BackgroundStyle, { name: string; light: Record<string, string>; dark: Record<string, string> }> = {
  default: {
    name: 'Default White',
    light: { '--background': 'oklch(1 0 0)', '--card': 'oklch(1 0 0)', '--sidebar': 'oklch(0.98 0.008 250)' },
    dark: { '--background': 'oklch(0.17 0.02 255)', '--card': 'oklch(0.22 0.02 255)', '--sidebar': 'oklch(0.20 0.02 255)' },
  },
  dark: {
    name: 'Dark',
    light: { '--background': 'oklch(0.17 0.02 255)', '--card': 'oklch(0.22 0.02 255)', '--sidebar': 'oklch(0.20 0.02 255)' },
    dark: { '--background': 'oklch(0.12 0.02 255)', '--card': 'oklch(0.18 0.02 255)', '--sidebar': 'oklch(0.15 0.02 255)' },
  },
  warm: {
    name: 'Warm Cream',
    light: { '--background': 'oklch(0.98 0.01 85)', '--card': 'oklch(0.99 0.008 85)', '--sidebar': 'oklch(0.97 0.01 85)' },
    dark: { '--background': 'oklch(0.18 0.02 55)', '--card': 'oklch(0.22 0.02 55)', '--sidebar': 'oklch(0.20 0.02 55)' },
  },
  cool: {
    name: 'Cool Gray',
    light: { '--background': 'oklch(0.97 0.005 260)', '--card': 'oklch(0.98 0.005 260)', '--sidebar': 'oklch(0.96 0.005 260)' },
    dark: { '--background': 'oklch(0.17 0.015 260)', '--card': 'oklch(0.22 0.015 260)', '--sidebar': 'oklch(0.20 0.015 260)' },
  },
  custom: {
    name: 'Custom Color',
    light: {},
    dark: {},
  },
};

interface ThemeStore {
  colorPreset: ColorPreset;
  backgroundStyle: BackgroundStyle;
  customBackground: string; // hex color for custom bg
  customPrimary: string; // oklch string for custom primary
  setColorPreset: (preset: ColorPreset) => void;
  setBackgroundStyle: (style: BackgroundStyle) => void;
  setCustomBackground: (color: string) => void;
  setCustomPrimary: (color: string) => void;
  applyTheme: () => void;
}

const STORAGE_KEY = 'elevate-theme-custom';

function loadSaved(): Partial<ThemeStore> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function savePersist(state: Partial<ThemeStore>) {
  if (typeof window === 'undefined') return;
  try {
    const toSave = {
      colorPreset: state.colorPreset,
      backgroundStyle: state.backgroundStyle,
      customBackground: state.customBackground,
      customPrimary: state.customPrimary,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch { /* ignore */ }
}

export const useThemeStore = create<ThemeStore>((set, get) => {
  const saved = loadSaved();

  return {
    colorPreset: (saved.colorPreset as ColorPreset) || 'brand',
    backgroundStyle: (saved.backgroundStyle as BackgroundStyle) || 'default',
    customBackground: saved.customBackground || '#ffffff',
    customPrimary: saved.customPrimary || '',

    setColorPreset: (preset) => {
      set({ colorPreset: preset });
      savePersist({ ...get(), colorPreset: preset });
      // Apply immediately
      setTimeout(() => get().applyTheme(), 0);
    },

    setBackgroundStyle: (style) => {
      set({ backgroundStyle: style });
      savePersist({ ...get(), backgroundStyle: style });
      setTimeout(() => get().applyTheme(), 0);
    },

    setCustomBackground: (color) => {
      set({ customBackground: color });
      savePersist({ ...get(), customBackground: color });
      setTimeout(() => get().applyTheme(), 0);
    },

    setCustomPrimary: (color) => {
      set({ customPrimary: color, colorPreset: 'custom' });
      savePersist({ ...get(), customPrimary: color, colorPreset: 'custom' });
      setTimeout(() => get().applyTheme(), 0);
    },

    applyTheme: () => {
      if (typeof document === 'undefined') return;
      const { colorPreset, backgroundStyle, customBackground, customPrimary } = get();
      const root = document.documentElement;
      const isDark = root.classList.contains('dark');

      // Apply color preset
      if (colorPreset === 'custom' && customPrimary) {
        root.style.setProperty('--primary', customPrimary);
        root.style.setProperty('--ring', customPrimary);
      } else {
        const preset = COLOR_PRESETS[colorPreset];
        root.style.setProperty('--primary', preset.primary);
        root.style.setProperty('--primary-foreground', preset.primaryForeground);
        root.style.setProperty('--accent', preset.accent);
        root.style.setProperty('--ring', preset.ring);
        root.style.setProperty('--secondary', preset.secondary);
        root.style.setProperty('--secondary-foreground', preset.secondaryForeground);
        root.style.setProperty('--sidebar-primary', preset.primary);
        root.style.setProperty('--sidebar-primary-foreground', preset.primaryForeground);
        root.style.setProperty('--sidebar-ring', preset.ring);
      }

      // Apply background style
      if (backgroundStyle === 'custom' && customBackground) {
        root.style.setProperty('--background', customBackground);
        root.style.setProperty('--card', customBackground);
      } else {
        const bg = BG_STYLES[backgroundStyle];
        const variant = isDark ? bg.dark : bg.light;
        Object.entries(variant).forEach(([key, value]) => {
          root.style.setProperty(key, value);
        });
      }
    },
  };
});
