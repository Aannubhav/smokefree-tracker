import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { darkColors, lightColors } from '../theme';

const storage = {
  getItem: (key) => {
    if (Platform.OS === 'web') return Promise.resolve(localStorage.getItem(key));
    return require('@react-native-async-storage/async-storage').default.getItem(key);
  },
  setItem: (key, value) => {
    if (Platform.OS === 'web') { localStorage.setItem(key, value); return; }
    return require('@react-native-async-storage/async-storage').default.setItem(key, value);
  },
};

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    storage.getItem('appTheme').then((val) => {
      if (val === 'light') setIsDark(false);
    });
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      storage.setItem('appTheme', next ? 'dark' : 'light');
      return next;
    });
  };

  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ colors, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
