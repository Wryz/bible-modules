/**
 * Bible Verses App
 * React Native app with iOS widget support
 *
 * @format
 */

import React, {useEffect} from 'react';
import {StatusBar, AppState, AppStateStatus} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {AppNavigator} from './src/navigation/AppNavigator';
import {ThemeProvider} from './src/theme/ThemeContext';
import {ThemeName} from './src/theme/themeLoader';
import {SchedulingService} from './src/services/schedulingService';
import 'react-native-gesture-handler';

function App() {
  // Default to dark theme for better visual experience
  const initialTheme: ThemeName = 'dark';

  useEffect(() => {
    // Handle app state changes to update verse when app comes to foreground
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // App has come to the foreground
        SchedulingService.updateVerseOnAppOpen().catch(error => {
          console.error('Error updating verse on app open:', error);
        });
      }
    };

    // Listen for app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Also update immediately when app first loads
    SchedulingService.updateVerseOnAppOpen().catch(error => {
      console.error('Error updating verse on app start:', error);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider initialTheme={initialTheme}>
        <StatusBar barStyle="light-content" />
        <AppNavigator />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

export default App;
