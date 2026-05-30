'use client';

import { useTheme } from 'next-themes';
import { useThemeStore, COLOR_PRESETS, BG_STYLES } from '@/stores/theme-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Sun, Moon, Monitor, Palette, Check, SwatchBook } from 'lucide-react';
import { useEffect, useRef, useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};

export function AppearanceSettings() {
  const { theme, setTheme } = useTheme();
  const { colorPreset, backgroundStyle, customBackground, customPrimary, setColorPreset, setBackgroundStyle, setCustomBackground, setCustomPrimary, applyTheme } = useThemeStore();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const initialApply = useRef(false);

  useEffect(() => {
    if (mounted && !initialApply.current) {
      initialApply.current = true;
      applyTheme();
    }
  }, [mounted]);

  if (!mounted) return null;

  const themeModes = [
    { value: 'light' as const, label: 'Light', icon: Sun },
    { value: 'dark' as const, label: 'Dark', icon: Moon },
    { value: 'system' as const, label: 'System', icon: Monitor },
  ];

  return (
    <div className="space-y-6">
      {/* Theme Mode */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sun className="h-4 w-4" />
            Theme Mode
          </CardTitle>
          <CardDescription>Choose between light and dark appearance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {themeModes.map((mode) => (
              <button
                key={mode.value}
                onClick={() => setTheme(mode.value)}
                className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all hover:border-primary/50 ${
                  theme === mode.value ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <mode.icon className={`h-5 w-5 ${theme === mode.value ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="text-sm font-medium">{mode.label}</span>
                {theme === mode.value && <Check className="h-4 w-4 text-primary" />}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Color Palette */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Color Palette
          </CardTitle>
          <CardDescription>Choose the primary color scheme for the interface</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {(Object.entries(COLOR_PRESETS) as [keyof typeof COLOR_PRESETS, typeof COLOR_PRESETS[keyof typeof COLOR_PRESETS]][]).map(([key, preset]) => (
              <button
                key={key}
                onClick={() => setColorPreset(key)}
                className={`flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all hover:border-primary/50 ${
                  colorPreset === key ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <div className="flex gap-1">
                  <div
                    className="h-6 w-6 rounded-full border"
                    style={{ backgroundColor: preset.primary }}
                  />
                  <div
                    className="h-6 w-6 rounded-full border"
                    style={{ backgroundColor: preset.accent }}
                  />
                  <div
                    className="h-6 w-6 rounded-full border"
                    style={{ backgroundColor: preset.secondary }}
                  />
                </div>
                <span className="text-xs font-medium">{preset.name}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Background Style */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <SwatchBook className="h-4 w-4" />
            Background
          </CardTitle>
          <CardDescription>Customize the background color of the interface</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {(Object.entries(BG_STYLES) as [keyof typeof BG_STYLES, typeof BG_STYLES[keyof typeof BG_STYLES]][]).map(([key, bg]) => (
              <button
                key={key}
                onClick={() => setBackgroundStyle(key)}
                className={`flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all hover:border-primary/50 ${
                  backgroundStyle === key ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <div className="flex gap-1">
                  <div
                    className="h-6 w-6 rounded-full border bg-white"
                    style={{
                      backgroundColor: Object.values(bg.light)[0] || undefined,
                    }}
                  />
                  <div
                    className="h-6 w-6 rounded-full border"
                    style={{
                      backgroundColor: Object.values(bg.dark)[0] || undefined,
                    }}
                  />
                </div>
                <span className="text-xs font-medium">{bg.name}</span>
              </button>
            ))}
          </div>

          {/* Custom background color picker */}
          {backgroundStyle === 'custom' && (
            <div className="space-y-2">
              <Label>Custom Background Color</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={customBackground}
                  onChange={(e) => setCustomBackground(e.target.value)}
                  className="h-10 w-10 rounded-lg border cursor-pointer"
                />
                <span className="text-sm text-muted-foreground">{customBackground}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
