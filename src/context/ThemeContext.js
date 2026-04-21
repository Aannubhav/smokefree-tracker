import React, { createContext, useContext } from 'react';
import { colors } from '../theme';

const ThemeContext = createContext({ colors, isDark: false, toggleTheme: () => {} });

export const ThemeProvider = ({ children }) => (
  <ThemeContext.Provider value={{ colors, isDark: false, toggleTheme: () => {} }}>
    {children}
  </ThemeContext.Provider>
);

export const useTheme = () => useContext(ThemeContext);
