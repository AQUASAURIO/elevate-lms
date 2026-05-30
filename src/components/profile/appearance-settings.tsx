'use client';

import { useTheme } from 'next-themes';
import { useThemeStore, COLOR_PRESETS, BG_STYLES } from '@/stores/theme-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Sun, Moon, Monitor, Palette, Check, SwatchBook, RotateCcw, Pipette } from 'lucide-react';
import { useEffect, useRef, useSyncExternalStore, useState } from 'react';
import { toast } from 'sonner';

const emptySubscribe = () => () => {};

export function AppearanceSettings() {
  const { theme, setTheme } = useTheme();
  const { colorPreset, backgroundStyle, customBackground, customPrimary, setColorPreset, setBackgroundStyle, setCustomBackground, setCustomPrimary, applyTheme, resetTheme } = useThemeStore();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const initialApply = useRef(false);
  const [primaryHexInput, setPrimaryHexInput] = useState(customPrimary);
  const [bgHexInput, setBgHexInput] = useState(customBackground);

  useEffect(() => {
    if (mounted && !initialApply.current) {
      initialApply.current = true;
      applyTheme();
    }
  }, [mounted, applyTheme]);

  if (!mounted) return null;

  const handlePrimaryHexSubmit = () => {
    const hex = primaryHexInput.trim();
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      setCustomPrimary(hex);
      toast.success('Primary color updated');
    } else {
      toast.error('Invalid hex color. Use format: #RRGGBB');
    }
  };

  const handleBgHexSubmit = () => {
    const hex = bgHexInput.trim();
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      setCustomBackground(hex);
      toast.success('Background color updated');
    } else {
      toast.error('Invalid hex color. Use format: #RRGGBB');
    }
  };

  const handleReset = () => {
    resetTheme();
    setPrimaryHexInput('#0077B6');
    setBgHexInput('#ffffff');
    toast.success('Theme reset to defaults');
  };

  const themeModes = [
    { value: 'light' as const, label: 'Light', icon: Sun, description: 'Bright and clean' },
    { value: 'dark' as const, label: 'Dark', icon: Moon, description: 'Easy on the eyes' },
    { value: 'system' as const, label: 'System', icon: Monitor, description: 'Follow system setting' },
  ];

  return (
    <div className="space-y-6">
      {/* Theme Mode */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sun className="h-5 w-5" />
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
                className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all hover:border-primary/50 hover:shadow-sm ${
                  theme === mode.value ? 'border-primary bg-primary/5 shadow-sm' : 'border-border'
                }`}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                  theme === mode.value ? 'bg-primary/10' : 'bg-muted'
                }`}>
                  <mode.icon className={`h-5 w-5 ${theme === mode.value ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <span className="text-sm font-medium">{mode.label}</span>
                <span className="text-[11px] text-muted-foreground">{mode.description}</span>
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
            <Palette className="h-5 w-5" />
            Color Palette
          </CardTitle>
          <CardDescription>Choose the primary color scheme. The default matches the Elévate logo colors (#0077B6 / #00B4D8).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {(Object.entries(COLOR_PRESETS) as [keyof typeof COLOR_PRESETS, typeof COLOR_PRESETS[keyof typeof COLOR_PRESETS]][]).map(([key, preset]) => (
              <button
                key={key}
                onClick={() => {
                  setColorPreset(key);
                  if (key !== 'custom') {
                    setPrimaryHexInput('#0077B6'); // Reset hex input to brand default
                  }
                }}
                className={`flex flex-col items-center gap-2.5 rounded-xl border-2 p-4 transition-all hover:border-primary/50 hover:shadow-sm ${
                  colorPreset === key ? 'border-primary bg-primary/5 shadow-sm' : 'border-border'
                }`}
              >
                <div className="flex gap-1.5">
                  <div
                    className="h-7 w-7 rounded-full border border-white/30 shadow-sm"
                    style={{ backgroundColor: preset.primary }}
                  />
                  <div
                    className="h-7 w-7 rounded-full border border-black/5 shadow-sm"
                    style={{ backgroundColor: preset.accent }}
                  />
                  <div
                    className="h-7 w-7 rounded-full border border-black/5 shadow-sm"
                    style={{ backgroundColor: preset.secondary }}
                  />
                </div>
                <div className="text-center">
                  <span className="text-xs font-semibold block">{preset.name}</span>
                  <span className="text-[10px] text-muted-foreground">{preset.description}</span>
                </div>
                {colorPreset === key && <Check className="h-4 w-4 text-primary" />}
              </button>
            ))}
          </div>

          {/* Custom Primary Color Picker */}
          <div className={`rounded-xl border-2 p-4 space-y-3 transition-all ${
            colorPreset === 'custom' ? 'border-primary bg-primary/5' : 'border-border'
          }`}>
            <div className="flex items-center gap-2">
              <Pipette className="h-4 w-4 text-primary" />
              <Label className="text-sm font-semibold">Custom Primary Color</Label>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={customPrimary}
                onChange={(e) => {
                  setPrimaryHexInput(e.target.value);
                  setCustomPrimary(e.target.value);
                }}
                className="h-10 w-10 rounded-lg border cursor-pointer"
              />
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="text"
                  value={primaryHexInput}
                  onChange={(e) => setPrimaryHexInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handlePrimaryHexSubmit();
                  }}
                  placeholder="#0077B6"
                  className="flex-1 h-9 rounded-lg border bg-background px-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <Button size="sm" variant="outline" onClick={handlePrimaryHexSubmit}>
                  Apply
                </Button>
              </div>
            </div>
            {/* Color preview swatch */}
            <div className="flex items-center gap-2">
              <div className="h-6 w-full rounded-md border" style={{ backgroundColor: customPrimary }} />
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">{customPrimary}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Background Style */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <SwatchBook className="h-5 w-5" />
            Background
          </CardTitle>
          <CardDescription>Customize the background color of the interface</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {(Object.entries(BG_STYLES) as [keyof typeof BG_STYLES, typeof BG_STYLES[keyof typeof BG_STYLES]][]).map(([key, bg]) => (
              <button
                key={key}
                onClick={() => {
                  setBackgroundStyle(key);
                  if (key !== 'custom') {
                    setBgHexInput('#ffffff');
                  }
                }}
                className={`flex flex-col items-center gap-2.5 rounded-xl border-2 p-4 transition-all hover:border-primary/50 hover:shadow-sm ${
                  backgroundStyle === key ? 'border-primary bg-primary/5 shadow-sm' : 'border-border'
                }`}
              >
                <div className="flex gap-1.5">
                  <div
                    className="h-7 w-7 rounded-full border border-black/5 shadow-sm bg-white"
                    style={{
                      backgroundColor: Object.values(bg.light)[0] || undefined,
                    }}
                  />
                  <div
                    className="h-7 w-7 rounded-full border border-white/10 shadow-sm"
                    style={{
                      backgroundColor: Object.values(bg.dark)[0] || undefined,
                    }}
                  />
                </div>
                <div className="text-center">
                  <span className="text-xs font-semibold block">{bg.name}</span>
                  <span className="text-[10px] text-muted-foreground">{bg.description}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Custom Background Color Picker */}
          <div className={`rounded-xl border-2 p-4 space-y-3 transition-all ${
            backgroundStyle === 'custom' ? 'border-primary bg-primary/5' : 'border-border'
          }`}>
            <div className="flex items-center gap-2">
              <SwatchBook className="h-4 w-4 text-primary" />
              <Label className="text-sm font-semibold">Custom Background Color</Label>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={customBackground}
                onChange={(e) => {
                  setBgHexInput(e.target.value);
                  setCustomBackground(e.target.value);
                }}
                className="h-10 w-10 rounded-lg border cursor-pointer"
              />
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="text"
                  value={bgHexInput}
                  onChange={(e) => setBgHexInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleBgHexSubmit();
                  }}
                  placeholder="#ffffff"
                  className="flex-1 h-9 rounded-lg border bg-background px-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <Button size="sm" variant="outline" onClick={handleBgHexSubmit}>
                  Apply
                </Button>
              </div>
            </div>
            {/* Color preview swatch */}
            <div className="flex items-center gap-2">
              <div className="h-6 w-full rounded-md border" style={{ backgroundColor: customBackground }} />
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">{customBackground}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reset Button */}
      <div className="flex justify-center pt-2">
        <Button variant="outline" onClick={handleReset} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Reset to Defaults
        </Button>
      </div>
    </div>
  );
}
