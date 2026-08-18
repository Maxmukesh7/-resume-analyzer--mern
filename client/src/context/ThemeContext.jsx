import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

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

  // 2. User General Settings (notifications, language, privacy)
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

  // Apply theme classes and attributes to <html> whenever darkMode changes
  useEffect(() => {
    const root = document.documentElement;

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

    localStorage.setItem('ats_dark_mode', JSON.stringify(darkMode));
  }, [darkMode]);

  // Toggle Dark Mode
  const toggleDarkMode = () => {
    setDarkModeState((prev) => !prev);
  };

  const setDarkMode = (val) => {
    setDarkModeState(Boolean(val));
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
