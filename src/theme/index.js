export const darkColors = {
  background: '#0D0D0D',
  surface: '#1A1A1A',
  surfaceHigh: '#252525',
  border: '#2A2A2A',
  primary: '#FF6B35',
  primaryLight: '#FF8C5A',
  danger: '#FF4444',
  success: '#4CAF50',
  warning: '#FFC107',
  info: '#2196F3',
  text: '#FFFFFF',
  textSecondary: '#AAAAAA',
  textMuted: '#555555',
  smoke: '#FF6B35',
};

export const lightColors = {
  background: '#F5F5F5',
  surface: '#FFFFFF',
  surfaceHigh: '#EBEBEB',
  border: '#E0E0E0',
  primary: '#FF6B35',
  primaryLight: '#FF8C5A',
  danger: '#E53935',
  success: '#43A047',
  warning: '#F59E0B',
  info: '#1E88E5',
  text: '#1A1A1A',
  textSecondary: '#666666',
  textMuted: '#AAAAAA',
  smoke: '#FF6B35',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

// Backward-compat default (dark theme)
export const theme = {
  colors: darkColors,
  spacing,
  radius,
  fontSize,
};
