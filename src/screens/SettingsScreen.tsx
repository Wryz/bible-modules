import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {WidgetSettings} from '../types';
import {StorageService} from '../services/storage';
import {SchedulingService} from '../services/schedulingService';
import {useTheme, useThemeContext} from '../theme/useTheme';
import {getShadowOpacity, isDarkColor} from '../theme/utils';
import {ThemeName, getAvailableThemes} from '../theme/themeLoader';
import {ColorPicker} from '../components/ColorPicker';

export const SettingsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const {setTheme, themeName, customColors, setCustomColors} = useThemeContext();
  const [settings, setSettings] = useState<WidgetSettings>({
    refreshFrequency: 'daily',
  });
  const [customHours, setCustomHours] = useState('24');
  const [primaryColorPickerVisible, setPrimaryColorPickerVisible] = useState(false);
  const isInitialLoad = useRef(true);
  const isInitialLoad = useRef(true);

  useEffect(() => {
    loadSettings();
  }, []);

  // Auto-save settings whenever they change
  useEffect(() => {
    // Skip saving on initial load
    if (isInitialLoad.current) {
      return;
    }
    
    const saveSettings = async () => {
      const newSettings: WidgetSettings = {
        ...settings,
        customHours:
          settings.refreshFrequency === 'custom'
            ? parseInt(customHours, 10)
            : undefined,
      };
      await StorageService.saveWidgetSettings(newSettings);
      // Reschedule verses with new frequency
      await SchedulingService.scheduleNextVerses(7);
    };
    
    saveSettings();
  }, [settings.refreshFrequency, customHours]);

  const loadSettings = async () => {
    const loaded = await StorageService.getWidgetSettings();
    setSettings(loaded);
    if (loaded.customHours) {
      setCustomHours(loaded.customHours.toString());
    }
    // Mark initial load as complete after settings are loaded
    isInitialLoad.current = false;
  };

  const styles = createStyles(theme, insets);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Widget Refresh Frequency</Text>
        <Text style={styles.sectionDescription}>
          Choose how often your widget displays a new verse
        </Text>

        <TouchableOpacity
          style={[
            styles.option,
            settings.refreshFrequency === 'hourly' && styles.optionSelected,
          ]}
          onPress={() => setSettings({...settings, refreshFrequency: 'hourly'})}>
          <Text
            style={[
              styles.optionText,
              settings.refreshFrequency === 'hourly' && styles.optionTextSelected,
            ]}>
            Hourly
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.option,
            settings.refreshFrequency === 'daily' && styles.optionSelected,
          ]}
          onPress={() => setSettings({...settings, refreshFrequency: 'daily'})}>
          <Text
            style={[
              styles.optionText,
              settings.refreshFrequency === 'daily' && styles.optionTextSelected,
            ]}>
            Daily
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.option,
            settings.refreshFrequency === 'custom' && styles.optionSelected,
          ]}
          onPress={() =>
            setSettings({...settings, refreshFrequency: 'custom'})
          }>
          <Text
            style={[
              styles.optionText,
              settings.refreshFrequency === 'custom' && styles.optionTextSelected,
            ]}>
            Custom
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.option,
            settings.refreshFrequency === 'onAppOpen' && styles.optionSelected,
          ]}
          onPress={() =>
            setSettings({...settings, refreshFrequency: 'onAppOpen'})
          }>
          <Text
            style={[
              styles.optionText,
              settings.refreshFrequency === 'onAppOpen' && styles.optionTextSelected,
            ]}>
            Every Time You Open the App
          </Text>
        </TouchableOpacity>

        {settings.refreshFrequency === 'custom' && (
          <View style={styles.customInputContainer}>
            <Text style={styles.customLabel}>Hours between updates:</Text>
            <TextInput
              style={styles.customInput}
              value={customHours}
              onChangeText={setCustomHours}
              keyboardType="numeric"
              placeholder="24"
              placeholderTextColor={theme.colors.textTertiary}
            />
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Theme</Text>
        <Text style={styles.sectionDescription}>
          Choose your preferred theme
        </Text>

        {getAvailableThemes().map((themeOption: ThemeName) => (
          <TouchableOpacity
            key={themeOption}
            style={[
              styles.option,
              themeName === themeOption && styles.optionSelected,
            ]}
            onPress={() => setTheme(themeOption)}>
            <Text
              style={[
                styles.optionText,
                themeName === themeOption && styles.optionTextSelected,
              ]}>
              {themeOption.charAt(0).toUpperCase() + themeOption.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Custom Colors</Text>
        <Text style={styles.sectionDescription}>
          Customize your app's accent colors
        </Text>

        {/* Primary Color */}
        <TouchableOpacity
          style={styles.colorOption}
          onPress={() => setPrimaryColorPickerVisible(true)}>
          <View style={styles.colorOptionContent}>
            <View style={styles.colorLabelContainer}>
              <Text style={styles.colorLabel}>Primary Color</Text>
              <Text style={styles.colorDescription}>
                Used for buttons, links, and accents
              </Text>
            </View>
            <View
              style={[
                styles.colorPreview,
                {backgroundColor: customColors?.primary || theme.colors.primary},
              ]}
            />
          </View>
        </TouchableOpacity>

        {/* Reset Colors */}
        {customColors?.primary && (
          <TouchableOpacity
            style={styles.resetButton}
            onPress={async () => {
              await setCustomColors(null);
            }}>
            <Text style={styles.resetButtonText}>Reset to Default Colors</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Color Pickers */}
      <ColorPicker
        visible={primaryColorPickerVisible}
        currentColor={customColors?.primary || theme.colors.primary}
        onColorSelect={async (color) => {
          await setCustomColors({
            primary: color,
          });
        }}
        onClose={() => setPrimaryColorPickerVisible(false)}
        title="Select Primary Color"
      />


    </ScrollView>
  );
};

const createStyles = (theme: any, insets: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    contentContainer: {
      paddingTop: insets.top + theme.safeArea.topPadding,
      paddingBottom: insets.bottom + theme.safeArea.tabBarHeight + theme.safeArea.bottomPadding,
    },
    section: {
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.lg,
      marginTop: theme.spacing.lg,
      marginHorizontal: theme.spacing.lg,
      borderRadius: theme.borderRadius.lg,
      borderWidth: 0.5,
      borderColor: theme.colors.border,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: getShadowOpacity(theme.colors.background),
      shadowRadius: 8,
      elevation: 3,
    },
    sectionTitle: {
      fontSize: theme.typography.sizes.xxl,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
      letterSpacing: theme.typography.letterSpacing.tight,
    },
    sectionDescription: {
      fontSize: theme.typography.sizes.body,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.lg,
      lineHeight: theme.typography.sizes.body * theme.typography.lineHeights.normal,
      letterSpacing: theme.typography.letterSpacing.normal,
    },
    option: {
      padding: theme.spacing.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.lg,
      marginBottom: theme.spacing.md,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: getShadowOpacity(theme.colors.background) * 0.7,
      shadowRadius: 4,
      elevation: 2,
    },
    optionSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: isDarkColor(theme.colors.background)
        ? theme.colors.surfaceElevated
        : '#E3F2FD',
      borderWidth: 2,
    },
    optionText: {
      fontSize: theme.typography.sizes.lg,
      color: theme.colors.text,
      letterSpacing: theme.typography.letterSpacing.normal,
    },
    optionTextSelected: {
      color: theme.colors.primary,
      fontWeight: theme.typography.weights.semibold,
    },
    customInputContainer: {
      marginTop: theme.spacing.md,
      paddingTop: theme.spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    customLabel: {
      fontSize: theme.typography.sizes.body,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.md,
      letterSpacing: theme.typography.letterSpacing.normal,
    },
    customInput: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      fontSize: theme.typography.sizes.body,
      color: theme.colors.text,
      backgroundColor: theme.colors.background,
      fontFamily: theme.typography.fonts.regular,
      letterSpacing: theme.typography.letterSpacing.normal,
    },
    colorOption: {
      padding: theme.spacing.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.lg,
      marginBottom: theme.spacing.md,
      backgroundColor: theme.colors.surfaceElevated,
    },
    colorOptionContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    colorLabelContainer: {
      flex: 1,
    },
    colorLabel: {
      fontSize: theme.typography.sizes.body,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    colorDescription: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.textSecondary,
    },
    colorPreview: {
      width: 50,
      height: 50,
      borderRadius: theme.borderRadius.md,
      borderWidth: 2,
      borderColor: theme.colors.border,
      marginLeft: theme.spacing.md,
    },
    resetButton: {
      marginTop: theme.spacing.md,
      padding: theme.spacing.md,
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    resetButtonText: {
      fontSize: theme.typography.sizes.body,
      color: theme.colors.error,
      fontWeight: theme.typography.weights.medium,
    },
  });
