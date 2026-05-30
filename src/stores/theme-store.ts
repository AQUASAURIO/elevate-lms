import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark' | 'system';
export type BackgroundStyle = 'default' | 'dark' | 'warm' | 'cool' | 'custom';
export type ColorPreset = 'brand' | 'ocean' | 'forest' | 'sunset' | 'royal' | 'custom';

interface ColorPresetConfig {
  name: string;
  description: string;
  primary: string;
  primaryForeground: string;
  accent: string;
  ring: string;
  secondary: string;
  secondaryForeground: string;
  dark?: {
    primary: string;
    primaryForeground: string;
    ring: string;
    sidebarPrimary: string;
    sidebarPrimaryForeground: string;
    chart1: string;
    chart2: string;
  };
}

export const COLOR_PRESETS: Record<ColorPreset, ColorPresetConfig> = {
  brand: {
    name: 'Elévate Brand',
    description: 'Official Elévate logo colors (#0077B6 / #00B4D8)',
    primary: 'oklch(0.52 0.14 240)',       // #0077B6 deep blue
    primaryForeground: 'oklch(0.985 0 0)',
    accent: 'oklch(0.95 0.04 215)',         // soft tint of #00B4D8
    ring: 'oklch(0.52 0.14 240)',
    secondary: 'oklch(0.95 0.02 235)',
    secondaryForeground: 'oklch(0.25 0.06 250)',
    dark: {
      primary: 'oklch(0.72 0.12 215)',    // #00B4D8 for dark mode
      primaryForeground: 'oklch(0.15 0.02 250)',
      ring: 'oklch(0.72 0.12 215)',
      sidebarPrimary: 'oklch(0.72 0.12 215)',
      sidebarPrimaryForeground: 'oklch(0.15 0.02 250)',
      chart1: 'oklch(0.72 0.12 215)',
      chart2: 'oklch(0.65 0.14 240)',
    },
  },
  ocean: {
    name: 'Ocean',
    description: 'Deep sea blues and teals',
    primary: 'oklch(0.52 0.14 230)',
    primaryForeground: 'oklch(0.985 0 0)',
    accent: 'oklch(0.95 0.04 220)',
    ring: 'oklch(0.52 0.14 230)',
    secondary: 'oklch(0.94 0.03 225)',
    secondaryForeground: 'oklch(0.25 0.08 240)',
    dark: {
      primary: 'oklch(0.68 0.14 230)',
      primaryForeground: 'oklch(0.15 0.02 240)',
      ring: 'oklch(0.68 0.14 230)',
      sidebarPrimary: 'oklch(0.68 0.14 230)',
      sidebarPrimaryForeground: 'oklch(0.15 0.02 240)',
      chart1: 'oklch(0.68 0.14 230)',
      chart2: 'oklch(0.60 0.12 220)',
    },
  },
  forest: {
    name: 'Forest',
    description: 'Natural greens and earth tones',
    primary: 'oklch(0.50 0.12 145)',
    primaryForeground: 'oklch(0.985 0 0)',
    accent: 'oklch(0.95 0.03 150)',
    ring: 'oklch(0.50 0.12 145)',
    secondary: 'oklch(0.95 0.02 148)',
    secondaryForeground: 'oklch(0.22 0.08 155)',
    dark: {
      primary: 'oklch(0.65 0.14 145)',
      primaryForeground: 'oklch(0.15 0.02 150)',
      ring: 'oklch(0.65 0.14 145)',
      sidebarPrimary: 'oklch(0.65 0.14 145)',
      sidebarPrimaryForeground: 'oklch(0.15 0.02 150)',
      chart1: 'oklch(0.65 0.14 145)',
      chart2: 'oklch(0.55 0.10 150)',
    },
  },
  sunset: {
    name: 'Sunset',
    description: 'Warm oranges and golden hues',
    primary: 'oklch(0.55 0.18 40)',
    primaryForeground: 'oklch(0.985 0 0)',
    accent: 'oklch(0.95 0.04 50)',
    ring: 'oklch(0.55 0.18 40)',
    secondary: 'oklch(0.95 0.03 45)',
    secondaryForeground: 'oklch(0.25 0.08 35)',
    dark: {
      primary: 'oklch(0.68 0.18 40)',
      primaryForeground: 'oklch(0.15 0.02 35)',
      ring: 'oklch(0.68 0.18 40)',
      sidebarPrimary: 'oklch(0.68 0.18 40)',
      sidebarPrimaryForeground: 'oklch(0.15 0.02 35)',
      chart1: 'oklch(0.68 0.18 40)',
      chart2: 'oklch(0.60 0.15 50)',
    },
  },
  royal: {
    name: 'Royal',
    description: 'Regal purples and violets',
    primary: 'oklch(0.45 0.20 300)',
    primaryForeground: 'oklch(0.985 0 0)',
    accent: 'oklch(0.95 0.04 290)',
    ring: 'oklch(0.45 0.20 300)',
    secondary: 'oklch(0.95 0.03 295)',
    secondaryForeground: 'oklch(0.20 0.06 310)',
    dark: {
      primary: 'oklch(0.60 0.20 300)',
      primaryForeground: 'oklch(0.15 0.02 310)',
      ring: 'oklch(0.60 0.20 300)',
      sidebarPrimary: 'oklch(0.60 0.20 300)',
      sidebarPrimaryForeground: 'oklch(0.15 0.02 310)',
      chart1: 'oklch(0.60 0.20 300)',
      chart2: 'oklch(0.50 0.16 290)',
    },
  },
  custom: {
    name: 'Custom',
    description: 'Choose your own color',
    primary: 'oklch(0.52 0.14 240)',
    primaryForeground: 'oklch(0.985 0 0)',
    accent: 'oklch(0.95 0.04 215)',
    ring: 'oklch(0.52 0.14 240)',
    secondary: 'oklch(0.95 0.02 235)',
    secondaryForeground: 'oklch(0.25 0.06 250)',
  },
};

export const BG_STYLES: Record<BackgroundStyle, { name: string; description: string; light: Record<string, string>; dark: Record<string, string> }> = {
  default: {
    name: 'Default',
    description: 'Clean white background',
    light: { '--background': 'oklch(1 0 0)', '--card': 'oklch(1 0 0)', '--sidebar': 'oklch(0.98 0.008 240)' },
    dark: { '--background': 'oklch(0.17 0.02 250)', '--card': 'oklch(0.22 0.02 250)', '--sidebar': 'oklch(0.20 0.02 250)' },
  },
  dark: {
    name: 'Dark',
    description: 'Dark background in all modes',
    light: { '--background': 'oklch(0.17 0.02 250)', '--card': 'oklch(0.22 0.02 250)', '--sidebar': 'oklch(0.20 0.02 250)' },
    dark: { '--background': 'oklch(0.12 0.02 250)', '--card': 'oklch(0.18 0.02 250)', '--sidebar': 'oklch(0.15 0.02 250)' },
  },
  warm: {
    name: 'Warm',
    description: 'Warm cream tones',
    light: { '--background': 'oklch(0.98 0.01 85)', '--card': 'oklch(0.99 0.008 85)', '--sidebar': 'oklch(0.97 0.01 85)' },
    dark: { '--background': 'oklch(0.18 0.02 55)', '--card': 'oklch(0.22 0.02 55)', '--sidebar': 'oklch(0.20 0.02 55)' },
  },
  cool: {
    name: 'Cool',
    description: 'Cool gray tones',
    light: { '--background': 'oklch(0.97 0.005 260)', '--card': 'oklch(0.98 0.005 260)', '--sidebar': 'oklch(0.96 0.005 260)' },
    dark: { '--background': 'oklch(0.17 0.015 260)', '--card': 'oklch(0.22 0.015 260)', '--sidebar': 'oklch(0.20 0.015 260)' },
  },
  custom: {
    name: 'Custom',
    description: 'Choose your own color',
    light: {},
    dark: {},
  },
};

interface ThemeStore {
  colorPreset: ColorPreset;
  backgroundStyle: BackgroundStyle;
  customBackground: string; // hex color for custom bg
  customPrimary: string; // hex color for custom primary
  setColorPreset: (preset: ColorPreset) => void;
  setBackgroundStyle: (style: BackgroundStyle) => void;
  setCustomBackground: (color: string) => void;
  setCustomPrimary: (color: string) => void;
  applyTheme: () => void;
  resetTheme: () => void;
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

/** Convert hex (#RRGGBB) to oklch string approximation */
function hexToOklch(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  // Linearize
  const lr = r <= 0.04045 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  const lg = g <= 0.04045 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  const lb = b <= 0.04045 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

  // XYZ (D65)
  const x = 0.4124564 * lr + 0.3575761 * lg + 0.1804375 * lb;
  const y = 0.2126729 * lr + 0.7151522 * lg + 0.0721750 * lb;
  const z = 0.0193339 * lr + 0.1191920 * lg + 0.9503041 * lb;

  // OKLab
  const l_ = Math.cbrt(0.8189330109 * x + 0.3618667424 * y - 0.1288597137 * z);
  const m_ = Math.cbrt(0.0329845436 * x + 0.9293118715 * y + 0.0361456387 * z);
  const s_ = Math.cbrt(0.0482003018 * x + 0.2643662691 * y + 0.6338517070 * z);

  const L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.4285922050 * m + 0.4505937099 * s_;
  const bVal = 0.0259040371 * l_ + 0.7827717662 * m - 0.8086757660 * s_;

  // OKLCH
  const C = Math.sqrt(a * a + bVal * bVal);
  let H = Math.atan2(bVal, a) * (180 / Math.PI);
  if (H < 0) H += 360;

  return `oklch(${L.toFixed(3)} ${C.toFixed(3)} ${H.toFixed(1)})`;
}

export const useThemeStore = create<ThemeStore>((set, get) => {
  const saved = loadSaved();

  return {
    colorPreset: (saved.colorPreset as ColorPreset) || 'brand',
    backgroundStyle: (saved.backgroundStyle as BackgroundStyle) || 'default',
    customBackground: saved.customBackground || '#ffffff',
    customPrimary: saved.customPrimary || '#0077B6',

    setColorPreset: (preset) => {
      set({ colorPreset: preset });
      savePersist({ ...get(), colorPreset: preset });
      setTimeout(() => get().applyTheme(), 0);
    },

    setBackgroundStyle: (style) => {
      set({ backgroundStyle: style });
      savePersist({ ...get(), backgroundStyle: style });
      setTimeout(() => get().applyTheme(), 0);
    },

    setCustomBackground: (color) => {
      set({ customBackground: color, backgroundStyle: 'custom' });
      savePersist({ ...get(), customBackground: color, backgroundStyle: 'custom' });
      setTimeout(() => get().applyTheme(), 0);
    },

    setCustomPrimary: (color) => {
      set({ customPrimary: color, colorPreset: 'custom' });
      savePersist({ ...get(), customPrimary: color, colorPreset: 'custom' });
      setTimeout(() => get().applyTheme(), 0);
    },

    resetTheme: () => {
      set({ colorPreset: 'brand', backgroundStyle: 'default', customBackground: '#ffffff', customPrimary: '#0077B6' });
      savePersist({ colorPreset: 'brand', backgroundStyle: 'default', customBackground: '#ffffff', customPrimary: '#0077B6' });
      // Remove all custom CSS vars to let CSS defaults take over
      if (typeof document !== 'undefined') {
        const root = document.documentElement;
        const varsToRemove = [
          '--primary', '--primary-foreground', '--accent', '--ring',
          '--secondary', '--secondary-foreground', '--sidebar-primary',
          '--sidebar-primary-foreground', '--sidebar-ring', '--background',
          '--card', '--sidebar', '--chart-1', '--chart-2',
        ];
        varsToRemove.forEach(v => root.style.removeProperty(v));
      }
    },

    applyTheme: () => {
      if (typeof document === 'undefined') return;
      const { colorPreset, backgroundStyle, customBackground, customPrimary } = get();
      const root = document.documentElement;
      const isDark = root.classList.contains('dark');

      // Apply color preset
      if (colorPreset === 'custom' && customPrimary) {
        const primaryOklch = hexToOklch(customPrimary);
        root.style.setProperty('--primary', primaryOklch);
        root.style.setProperty('--ring', primaryOklch);
        root.style.setProperty('--sidebar-primary', primaryOklch);
        root.style.setProperty('--chart-1', primaryOklch);
      } else {
        const preset = COLOR_PRESETS[colorPreset];
        if (isDark && preset.dark) {
          root.style.setProperty('--primary', preset.dark.primary);
          root.style.setProperty('--ring', preset.dark.ring);
          root.style.setProperty('--sidebar-primary', preset.dark.sidebarPrimary);
          root.style.setProperty('--sidebar-primary-foreground', preset.dark.sidebarPrimaryForeground);
          root.style.setProperty('--chart-1', preset.dark.chart1);
          root.style.setProperty('--chart-2', preset.dark.chart2);
        } else {
          root.style.setProperty('--primary', preset.primary);
          root.style.setProperty('--primary-foreground', preset.primaryForeground);
          root.style.setProperty('--accent', preset.accent);
          root.style.setProperty('--ring', preset.ring);
          root.style.setProperty('--secondary', preset.secondary);
          root.style.setProperty('--secondary-foreground', preset.secondaryForeground);
          root.style.setProperty('--sidebar-primary', preset.primary);
          root.style.setProperty('--sidebar-primary-foreground', preset.primaryForeground);
          root.style.setProperty('--sidebar-ring', preset.ring);
          root.style.setProperty('--chart-1', preset.primary);
        }
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
