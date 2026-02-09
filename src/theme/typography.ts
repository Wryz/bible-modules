export const typography = {
  fonts: {
    regular: 'System', // iOS: San Francisco, Android: Roboto
    serif: 'Times New Roman', // Classic Bible font
    serifItalic: 'Times New Roman',
    serifBold: 'Times New Roman',
    monospace: 'Courier',
  },
  sizes: {
    xs: 11,
    sm: 13,
    body: 16,
    lg: 19,
    xl: 22,
    xxl: 26,
    heading: 30,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  lineHeights: {
    tight: 1.3,
    normal: 1.6,
    relaxed: 1.8,
  },
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
  },
};
