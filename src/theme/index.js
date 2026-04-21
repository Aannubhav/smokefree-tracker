export const colors = {
  background: '#FFFFFF',
  surface: '#F8FAFC',
  surfaceHigh: '#F1F5F9',
  border: '#E2E8F0',

  primary: '#3B82F6',
  primaryDark: '#1D4ED8',
  primaryLight: '#EFF6FF',

  accent: '#FB923C',
  accentDark: '#EA580C',
  accentLight: '#FFF7ED',

  text: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',

  success: '#22C55E',
  successLight: '#F0FDF4',
  danger: '#EF4444',
  dangerLight: '#FEF2F2',
  warning: '#F59E0B',

  smoke: '#FB923C',
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };

export const radius = { sm: 6, md: 12, lg: 16, xl: 20, full: 9999 };

export const fontSize = {
  xs: 11, sm: 13, md: 15, lg: 18, xl: 22, xxl: 28, xxxl: 36,
};

// Backward-compat exports
export const darkColors = colors;
export const lightColors = colors;
export const theme = { colors, spacing, radius, fontSize };
