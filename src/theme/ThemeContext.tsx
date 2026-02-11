import React, {
  createContext,
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import {AppState, AppStateStatus} from 'react-native';
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

  // Load saved theme and custom colors on mount
  useEffect(() => {
    const loadSaved = async () => {
      const [savedTheme, savedColors] = await Promise.all([
        StorageService.getThemeName(),
        StorageService.getCustomColors(),
      ]);
      if (savedTheme) {
        setThemeName(savedTheme);
      }
      if (savedColors) {
        setCustomColorsState(savedColors);
      }
    };
    loadSaved();
  }, []);

  // Sync current theme/colors to the widget (called on change and when app comes to foreground)
  const syncThemeToWidget = useCallback(
    async (themeColors: ColorPalette) => {
      try {
        const WidgetDataManager = require('../native/WidgetDataManager').default;
        if (WidgetDataManager.updateThemeName) {
          WidgetDataManager.updateThemeName(themeName).catch((error: Error) => {
            console.error('Error syncing theme name to widget:', error);
          });
        }
        if (WidgetDataManager.updateThemeColors) {
          await WidgetDataManager.updateThemeColors(
            themeColors.primary || null,
          ).catch((error: Error) => {
            console.error('Error syncing theme colors to widget:', error);
          });
        }
      } catch (error) {
        console.error('Error syncing theme to widget:', error);
      }
    },
    [themeName],
  );

  // Update theme colors when theme name or custom colors change
  useEffect(() => {
    const updateColors = async () => {
      const themeColors = await loadTheme(themeName, customColors);
      setColors(themeColors);
      await syncThemeToWidget(themeColors);
    };
    updateColors();
  }, [themeName, customColors, syncThemeToWidget]);

  // Re-sync theme to widget when app comes to foreground (ensures widget has latest color)
  const colorsRef = useRef<ColorPalette | null>(null);
  colorsRef.current = colors;
  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      (nextAppState: AppStateStatus) => {
        if (nextAppState === 'active' && colorsRef.current) {
          syncThemeToWidget(colorsRef.current).catch(() => {});
        }
      },
    );
    return () => subscription.remove();
  }, [syncThemeToWidget]);

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

  const setTheme = useCallback((name: ThemeName) => {
    setThemeName(name);
    StorageService.saveThemeName(name).catch(error => {
      console.error('Error saving theme name:', error);
    });
  }, []);

  const contextValue = useMemo(
    () => ({
      theme,
      themeName,
      setTheme,
      customColors,
      setCustomColors,
    }),
    [theme, themeName, customColors, setTheme],
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};
