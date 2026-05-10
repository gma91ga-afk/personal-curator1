// Theme constants for the app
export const COLORS = {
  // Primary palette
  primary: '#6C5CE7',       // Purple - main accent
  primaryLight: '#A29BFE',
  primaryDark: '#4834D4',

  // Backgrounds
  background: '#0F0F1A',    // Near-black with blue tint
  surface: '#1A1A2E',       // Card surfaces
  surfaceLight: '#252540',  // Elevated surfaces

  // Text
  text: '#FFFFFF',
  textSecondary: '#B0B0C8',
  textMuted: '#6B6B80',

  // Accents
  success: '#00D68F',
  warning: '#FFAA00',
  error: '#FF4757',

  // Misc
  border: '#2D2D45',
  overlay: 'rgba(0,0,0,0.7)',
};

export const FONTS = {
  regular: { fontFamily: 'System', fontWeight: '400' as const },
  medium: { fontFamily: 'System', fontWeight: '500' as const },
  semibold: { fontFamily: 'System', fontWeight: '600' as const },
  bold: { fontFamily: 'System', fontWeight: '700' as const },
  mono: { fontFamily: 'monospace', fontWeight: '400' as const },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const RADIUS = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};
