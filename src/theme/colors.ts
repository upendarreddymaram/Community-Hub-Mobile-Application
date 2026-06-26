export type ThemeColors = {
  primary: string;
  primaryDark: string;
  primaryMuted: string;
  background: string;
  surface: string;
  surfaceMuted: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  error: string;
  errorBackground: string;
  success: string;
  successBackground: string;
  warning: string;
  offline: string;
  offlineBackground: string;
  overlay: string;
  shadow: string;
  logoBackdrop: string;
  logoBorder: string;
};

export const lightColors: ThemeColors = {
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  primaryMuted: '#EFF6FF',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceMuted: '#F8FAFC',
  text: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  error: '#DC2626',
  errorBackground: '#FEF2F2',
  success: '#16A34A',
  successBackground: '#F0FDF4',
  warning: '#D97706',
  offline: '#92400E',
  offlineBackground: '#FEF3C7',
  overlay: 'rgba(15, 23, 42, 0.6)',
  shadow: '#000000',
  logoBackdrop: '#FFFFFF',
  logoBorder: 'transparent',
};

export const darkColors: ThemeColors = {
  primary: '#3B82F6',
  primaryDark: '#2563EB',
  primaryMuted: '#1E3A5F',
  background: '#121212',
  surface: '#1E1E1E',
  surfaceMuted: '#252525',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  border: '#334155',
  error: '#F87171',
  errorBackground: '#3F1D1D',
  success: '#4ADE80',
  successBackground: '#14532D',
  warning: '#FBBF24',
  offline: '#FCD34D',
  offlineBackground: '#422006',
  overlay: 'rgba(0, 0, 0, 0.72)',
  shadow: '#000000',
  logoBackdrop: '#FFFFFF',
  logoBorder: 'rgba(255, 255, 255, 0.2)',
};

/** @deprecated Prefer useTheme() for theme-aware colors */
export const colors = lightColors;
