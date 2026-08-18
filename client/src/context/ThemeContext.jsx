import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ACCENT_THEMES = {
  'neon-glow': {
    id: 'neon-glow',
    name: 'Blue + Purple Neon (Recommended)',
    primary: '#3b82f6',
    secondary: '#a855f7',
    gradient: 'from-blue-600 to-purple-600',
    orb1: 'rgba(59, 130, 246, 0.18)',
    orb2: 'rgba(168, 85, 247, 0.18)',
    badgeClass: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  },
  'cyberpunk': {
    id: 'cyberpunk',
    name: 'Cyberpunk Amber',
    primary: '#f59e0b',
    secondary: '#f43f5e',
    gradient: 'from-amber-500 to-rose-600',
    orb1: 'rgba(245, 158, 11, 0.18)',
    orb2: 'rgba(244, 63, 94, 0.18)',
    badgeClass: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  },
  'midnight': {
    id: 'midnight',
    name: 'Deep Midnight Forest',
    primary: '#10b981',
    secondary: '#06b6d4',
    gradient: 'from-emerald-500 to-cyan-600',
    orb1: 'rgba(16, 185, 129, 0.18)',
    orb2: 'rgba(6, 182, 212, 0.18)',
    badgeClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  },
  'classic-dark': {
    id: 'classic-dark',
    name: 'Classic Slate Dark',
    primary: '#6366f1',
    secondary: '#64748b',
    gradient: 'from-indigo-600 to-slate-600',
    orb1: 'rgba(99, 102, 241, 0.18)',
    orb2: 'rgba(100, 116, 139, 0.15)',
    badgeClass: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
  },
};

export function ThemeProvider({ children }) {
  // 1. Dark Mode State (persisted in localStorage, default true)
  const [darkMode, setDarkModeState] = useState(() => {
    const saved = localStorage.getItem('ats_dark_mode');
    if (saved !== null) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return true;
      }
    }
    return true;
  });

  // 2. Accent Tone Glow State (persisted in localStorage, default 'neon-glow')
  const [accent, setAccentState] = useState(() => {
    const saved = localStorage.getItem('ats_accent_tone');
    return saved && ACCENT_THEMES[saved] ? saved : 'neon-glow';
  });

  // 3. User General Settings (notifications, language, privacy)
  const [settings, setSettingsState] = useState(() => {
    const saved = localStorage.getItem('ats_user_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return {
      emailAlerts: true,
      pushAlerts: false,
      language: 'en',
      isPublic: false,
    };
  });

  // Apply theme classes and attributes to <html> whenever darkMode or accent changes
  useEffect(() => {
    const root = document.documentElement;

    // Dark/Light classes
    if (darkMode) {
      root.classList.add('dark');
      root.classList.remove('light');
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
    }

    // Accent attribute & CSS variables
    root.setAttribute('data-accent', accent);
    const themeConfig = ACCENT_THEMES[accent] || ACCENT_THEMES['neon-glow'];
    root.style.setProperty('--accent-primary', themeConfig.primary);
    root.style.setProperty('--accent-secondary', themeConfig.secondary);
    root.style.setProperty('--accent-orb-1', themeConfig.orb1);
    root.style.setProperty('--accent-orb-2', themeConfig.orb2);

    localStorage.setItem('ats_dark_mode', JSON.stringify(darkMode));
    localStorage.setItem('ats_accent_tone', accent);
  }, [darkMode, accent]);

  // Toggle Dark Mode
  const toggleDarkMode = () => {
    setDarkModeState((prev) => !prev);
  };

  const setDarkMode = (val) => {
    setDarkModeState(Boolean(val));
  };

  const setAccent = (accentKey) => {
    if (ACCENT_THEMES[accentKey]) {
      setAccentState(accentKey);
    }
  };

  const updateSettings = (partial) => {
    setSettingsState((prev) => {
      const updated = { ...prev, ...partial };
      localStorage.setItem('ats_user_settings', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <ThemeContext.Provider
      value={{
        darkMode,
        toggleDarkMode,
        setDarkMode,
        accent,
        setAccent,
        accentConfig: ACCENT_THEMES[accent] || ACCENT_THEMES['neon-glow'],
        settings,
        updateSettings,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
