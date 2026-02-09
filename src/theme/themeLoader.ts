import {ColorPalette} from './types';

export type ThemeName = 'light' | 'dark';

export interface ThemeData {
  name: ThemeName;
  colors: ColorPalette;
}

// Import theme JSON files
import lightTheme from './themes/light.json';
import darkTheme from './themes/dark.json';

const themes: Record<ThemeName, ThemeData> = {
  light: lightTheme as ThemeData,
  dark: darkTheme as ThemeData,
};

export const getTheme = (themeName: ThemeName): ThemeData => {
  return themes[themeName];
};

export const getAvailableThemes = (): ThemeName[] => {
  return Object.keys(themes) as ThemeName[];
};

export const loadTheme = async (
  themeName: ThemeName,
  customColors?: {primary?: string} | null,
): Promise<ColorPalette> => {
  const theme = getTheme(themeName);
  const colors = {...theme.colors};

  // Apply custom colors if provided
  if (customColors?.primary) {
    colors.primary = customColors.primary;
    // Generate darker shade for primaryDark
    colors.primaryDark = darkenColor(customColors.primary, 0.2);
    colors.tabBarActive = customColors.primary;
  }

  return colors;
};

// Sync version for initial load
export const loadThemeSync = (themeName: ThemeName): ColorPalette => {
  const theme = getTheme(themeName);
  return theme.colors;
};

// Helper function to darken a color
function darkenColor(color: string, amount: number): string {
  // Remove # if present
  const hex = color.replace('#', '');
  const num = parseInt(hex, 16);
  const r = Math.max(0, Math.min(255, Math.floor(((num >> 16) & 0xff) * (1 - amount))));
  const g = Math.max(0, Math.min(255, Math.floor(((num >> 8) & 0xff) * (1 - amount))));
  const b = Math.max(0, Math.min(255, Math.floor((num & 0xff) * (1 - amount))));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
