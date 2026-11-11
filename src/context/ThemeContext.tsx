import React, { createContext, useContext, useState, useEffect } from 'react';
import { Sun, Moon, Palette, Sparkles, Check } from 'lucide-react';

export type PortalThemeId = 'ocean' | 'citrus' | 'indigo' | 'dark';

export interface PortalThemeMeta {
  id: PortalThemeId;
  name: string;
  shortLabel: string;
  subtitle: string;
  swatchBg: string;
  swatchColors: string[];
  isDark: boolean;
  heroGradient: string;
  primaryBtn: string;
  accentBadge: string;
  canvasBg: string;
  cardBg: string;
  cardBorder: string;
  headingText: string;
  subText: string;
  textPrimary: string;
  textSecondary: string;
  headerBg: string;
  headerBorder: string;
  brandGradient: string;
  accentText: string;
}

export const PORTAL_THEMES: Record<PortalThemeId, PortalThemeMeta> = {
  ocean: {
    id: 'ocean',
    name: 'Ocean Daylight',
    shortLabel: 'Ocean Blue',
    subtitle: 'Crisp Blue & Clean White (Easy to Read)',
    swatchBg: 'bg-gradient-to-tr from-blue-600 to-cyan-500',
    swatchColors: ['#2563eb', '#06b6d4', '#f8fafc'],
    isDark: false,
    heroGradient: 'from-blue-950 via-sky-900 to-slate-900',
    primaryBtn: 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white',
    accentBadge: 'bg-blue-100 text-blue-900 border-blue-300',
    canvasBg: 'bg-slate-50 text-slate-900',
    cardBg: 'bg-white text-slate-900',
    cardBorder: 'border-slate-200',
    headingText: 'text-slate-900',
    subText: 'text-slate-600',
    textPrimary: 'text-slate-900',
    textSecondary: 'text-slate-600',
    headerBg: 'bg-white/95 backdrop-blur-md',
    headerBorder: 'border-slate-200',
    brandGradient: 'from-blue-600 via-sky-500 to-cyan-400 text-white',
    accentText: 'text-blue-700',
  },
  citrus: {
    id: 'citrus',
    name: 'Emerald & Citrus',
    shortLabel: 'Citrus Green',
    subtitle: 'Vibrant Green & Warm Amber Light',
    swatchBg: 'bg-gradient-to-tr from-emerald-600 to-amber-500',
    swatchColors: ['#059669', '#f59e0b', '#fafaf9'],
    isDark: false,
    heroGradient: 'from-slate-950 via-emerald-950 to-slate-900',
    primaryBtn: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white',
    accentBadge: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    canvasBg: 'bg-stone-50 text-slate-900',
    cardBg: 'bg-white text-slate-900',
    cardBorder: 'border-slate-200',
    headingText: 'text-slate-900',
    subText: 'text-slate-600',
    textPrimary: 'text-slate-900',
    textSecondary: 'text-slate-600',
    headerBg: 'bg-white/95 backdrop-blur-md',
    headerBorder: 'border-slate-200',
    brandGradient: 'from-orange-500 via-amber-500 to-yellow-400 text-slate-950',
    accentText: 'text-emerald-700',
  },
  indigo: {
    id: 'indigo',
    name: 'Royal Indigo',
    shortLabel: 'Royal Indigo',
    subtitle: 'Modern Violet & Crisp Slate Light',
    swatchBg: 'bg-gradient-to-tr from-indigo-600 to-purple-600',
    swatchColors: ['#4f46e5', '#9333ea', '#eef2ff'],
    isDark: false,
    heroGradient: 'from-indigo-950 via-purple-950 to-slate-900',
    primaryBtn: 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white',
    accentBadge: 'bg-indigo-100 text-indigo-900 border-indigo-300',
    canvasBg: 'bg-indigo-50/40 text-slate-900',
    cardBg: 'bg-white text-slate-900',
    cardBorder: 'border-indigo-100',
    headingText: 'text-slate-900',
    subText: 'text-slate-600',
    textPrimary: 'text-slate-900',
    textSecondary: 'text-slate-600',
    headerBg: 'bg-white/95 backdrop-blur-md',
    headerBorder: 'border-indigo-100',
    brandGradient: 'from-indigo-600 via-purple-600 to-fuchsia-500 text-white',
    accentText: 'text-indigo-700',
  },
  dark: {
    id: 'dark',
    name: 'Midnight Dark',
    shortLabel: 'Midnight Dark',
    subtitle: 'High-Contrast Eye-Comfort Dark Mode',
    swatchBg: 'bg-gradient-to-tr from-slate-900 via-indigo-900 to-emerald-600',
    swatchColors: ['#0f172a', '#10b981', '#38bdf8'],
    isDark: true,
    heroGradient: 'from-slate-950 via-slate-900 to-indigo-950',
    primaryBtn: 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white',
    accentBadge: 'bg-slate-800 text-emerald-300 border-slate-700',
    canvasBg: 'bg-slate-950 text-slate-100',
    cardBg: 'bg-slate-900 text-slate-100',
    cardBorder: 'border-slate-800',
    headingText: 'text-white',
    subText: 'text-slate-400',
    textPrimary: 'text-slate-100',
    textSecondary: 'text-slate-400',
    headerBg: 'bg-slate-900/95 backdrop-blur-md',
    headerBorder: 'border-slate-800',
    brandGradient: 'from-emerald-500 via-teal-500 to-cyan-400 text-slate-950',
    accentText: 'text-emerald-400',
  },
};

interface ThemeContextValue {
  themeId: PortalThemeId;
  theme: PortalThemeMeta;
  setThemeId: (id: PortalThemeId) => void;
  cycleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  themeId: 'ocean',
  theme: PORTAL_THEMES.ocean,
  setThemeId: () => {},
  cycleTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeId, setThemeIdState] = useState<PortalThemeId>(() => {
    try {
      const saved = localStorage.getItem('citrus_portal_theme') as PortalThemeId | null;
      if (saved && PORTAL_THEMES[saved]) return saved;
    } catch {}
    return 'ocean';
  });

  const setThemeId = (id: PortalThemeId) => {
    setThemeIdState(id);
    try {
      localStorage.setItem('citrus_portal_theme', id);
    } catch {}
  };

  const cycleTheme = () => {
    const order: PortalThemeId[] = ['ocean', 'citrus', 'indigo', 'dark'];
    const next = order[(order.indexOf(themeId) + 1) % order.length];
    setThemeId(next);
  };

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-ocean', 'theme-citrus', 'theme-indigo', 'theme-dark', 'dark');
    root.classList.add(`theme-${themeId}`);
    if (themeId === 'dark') {
      root.classList.add('dark');
    }
  }, [themeId]);

  return (
    <ThemeContext.Provider
      value={{
        themeId,
        theme: PORTAL_THEMES[themeId],
        setThemeId,
        cycleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const usePortalTheme = () => useContext(ThemeContext);

/**
 * Interactive Theme Icon & Popover Switcher Button
 * Can be placed in any Header or Toolbar across Home and Admin pages.
 */
export const ThemeSwitcherButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { themeId, theme, setThemeId } = usePortalTheme();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        title={`Current Theme: ${theme.name} — Click to switch portal theme`}
        className={`px-3 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer border shadow-xs whitespace-nowrap shrink-0 ${
          theme.isDark
            ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700'
            : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
        }`}
      >
        <div className={`w-4 h-4 rounded-md ${theme.swatchBg} flex items-center justify-center text-white shadow-xs`}>
          {theme.isDark ? <Moon className="w-2.5 h-2.5" /> : <Palette className="w-2.5 h-2.5" />}
        </div>
        {!compact && <span className="hidden sm:inline">{theme.name}</span>}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div
            className={`absolute right-0 mt-2 w-64 rounded-2xl shadow-2xl border p-2.5 z-50 space-y-1.5 ${
              theme.isDark
                ? 'bg-slate-900 border-slate-700 text-slate-100'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="px-2 py-1 text-[11px] font-black uppercase tracking-wider opacity-60 flex items-center justify-between">
              <span>Select Portal Theme</span>
              <Sun className="w-3.5 h-3.5" />
            </div>
            {(Object.values(PORTAL_THEMES) as PortalThemeMeta[]).map((t) => {
              const active = t.id === themeId;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setThemeId(t.id);
                    setOpen(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between gap-2.5 transition-all cursor-pointer border ${
                    active
                      ? theme.isDark
                        ? 'bg-slate-800 border-emerald-500/60 text-white'
                        : 'bg-slate-100 border-slate-300 text-slate-950'
                      : theme.isDark
                      ? 'border-transparent hover:bg-slate-800/60 text-slate-300'
                      : 'border-transparent hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-7 h-7 rounded-lg ${t.swatchBg} shrink-0 shadow-sm flex items-center justify-center text-white`}>
                      {t.isDark ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-black truncate">{t.name}</div>
                      <div className="text-[10px] opacity-70 truncate">{t.subtitle}</div>
                    </div>
                  </div>
                  {active && <Check className="w-4 h-4 text-emerald-500 shrink-0" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
