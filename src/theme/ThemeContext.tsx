import React, {createContext, useState, useMemo, useEffect, ReactNode} from 'react';
import {ThemeName, loadTheme} from './themeLoader';
import {ColorPalette} from './types';
import {spacing, safeArea, borderRadius} from './spacing';
import {typography} from './typography';
import {StorageService} from '../services/storage';

export interface Theme {
  colors: ColorPalette;
  spacing: typeof spacing;
  safeArea: typeof safeArea;
  borderRadius: typeof borderRadius;
  typography: typeof typography;
  themeName: ThemeName;
}

interface ThemeContextType {
  theme: Theme;
  themeName: ThemeName;
  setTheme: (theme: ThemeName) => void;
  customColors: {primary?: string} | null;
  setCustomColors: (colors: {primary?: string} | null) => Promise<void>;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined,
);

interface ThemeProviderProps {
  children: ReactNode;
  initialTheme?: ThemeName;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  initialTheme,
}) => {
  // Default to dark theme if no initial theme provided
  const [themeName, setThemeName] = useState<ThemeName>(
    initialTheme || 'dark',
  );
  const [customColors, setCustomColorsState] = useState<{primary?: string} | null>(null);
  const [colors, setColors] = useState<ColorPalette>(() => {
    // Initial sync load - will be updated by useEffect
    const {loadThemeSync} = require('./themeLoader');
    return loadThemeSync(themeName || 'dark');
  });

  // Load custom colors on mount
  useEffect(() => {
    const loadCustomColors = async () => {
      const saved = await StorageService.getCustomColors();
      if (saved) {
        setCustomColorsState(saved);
      }
    };
    loadCustomColors();
  }, []);

  // Update theme colors when theme name or custom colors change
  useEffect(() => {
    const updateColors = async () => {
      const themeColors = await loadTheme(themeName, customColors);
      setColors(themeColors);
      // Sync theme name and colors to widget
      try {
        const WidgetDataManager = require('../native/WidgetDataManager').default;
        if (WidgetDataManager.updateThemeName) {
          await WidgetDataManager.updateThemeName(themeName);
        }
        if (WidgetDataManager.updateThemeColors) {
          // Always sync the actual primary color being used (from theme or custom)
          await WidgetDataManager.updateThemeColors(
            themeColors.primary || null,
          );
        }
      } catch (error) {
        console.error('Error syncing theme to widget:', error);
      }
    };
    updateColors();
  }, [themeName, customColors]);

  const theme: Theme = useMemo(
    () => ({
      colors,
      spacing,
      safeArea,
      borderRadius,
      typography,
      themeName,
    }),
    [colors, themeName],
  );

  const setCustomColors = async (newColors: {primary?: string} | null) => {
    if (newColors) {
      await StorageService.saveCustomColors(newColors);
    } else {
      await StorageService.saveCustomColors({});
    }
    setCustomColorsState(newColors);
  };

  const contextValue = useMemo(
    () => ({
      theme,
      themeName,
      setTheme: setThemeName,
      customColors,
      setCustomColors,
    }),
    [theme, themeName, customColors],
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};
