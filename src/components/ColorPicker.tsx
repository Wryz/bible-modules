import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import {useTheme} from '../theme/useTheme';
import {getShadowOpacity} from '../theme/utils';

interface ColorPickerProps {
  visible: boolean;
  currentColor: string;
  onColorSelect: (color: string) => void;
  onClose: () => void;
  title?: string;
}

// Preset color options
const PRESET_COLORS = [
  '#5B8FF9', // Blue (default)
  '#007AFF', // iOS Blue
  '#34C759', // Green
  '#FF9500', // Orange
  '#FF3B30', // Red
  '#AF52DE', // Purple
  '#FF2D55', // Pink
  '#5856D6', // Indigo
  '#00C7BE', // Teal
  '#FFCC00', // Yellow
  '#8B4513', // Brown
  '#7C7CE8', // Lavender
];

export const ColorPicker: React.FC<ColorPickerProps> = ({
  visible,
  currentColor,
  onColorSelect,
  onClose,
  title = 'Select Color',
}) => {
  const theme = useTheme();
  const [customColor, setCustomColor] = useState(currentColor);
  const styles = createStyles(theme);

  const handlePresetSelect = (color: string) => {
    onColorSelect(color);
    onClose();
  };

  const handleCustomColorSubmit = () => {
    // Validate hex color
    const hexPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (hexPattern.test(customColor)) {
      onColorSelect(customColor);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>{title}</Text>

          <ScrollView style={styles.scrollView}>
            {/* Preset Colors */}
            <Text style={styles.sectionTitle}>Preset Colors</Text>
            <View style={styles.colorGrid}>
              {PRESET_COLORS.map((color, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.colorSwatch,
                    {backgroundColor: color},
                    currentColor === color && styles.colorSwatchSelected,
                  ]}
                  onPress={() => handlePresetSelect(color)}>
                  {currentColor === color && (
                    <View style={styles.checkmark}>
                      <Text style={styles.checkmarkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom Color Input */}
            <Text style={styles.sectionTitle}>Custom Color</Text>
            <View style={styles.customColorContainer}>
              <View
                style={[
                  styles.colorPreview,
                  {backgroundColor: customColor},
                ]}
              />
              <TextInput
                style={styles.colorInput}
                value={customColor}
                onChangeText={setCustomColor}
                placeholder="#5B8FF9"
                placeholderTextColor={theme.colors.textTertiary}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.applyButton}
                onPress={handleCustomColorSubmit}>
                <Text style={styles.applyButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.lg,
    },
    container: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.xl,
      width: '100%',
      maxWidth: 400,
      maxHeight: '80%',
      padding: theme.spacing.lg,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    title: {
      fontSize: theme.typography.sizes.xl,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.text,
      marginBottom: theme.spacing.lg,
      textAlign: 'center',
    },
    scrollView: {
      maxHeight: 400,
    },
    sectionTitle: {
      fontSize: theme.typography.sizes.body,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.lg,
      marginBottom: theme.spacing.md,
    },
    colorGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: theme.spacing.lg,
    },
    colorSwatch: {
      width: 50,
      height: 50,
      borderRadius: theme.borderRadius.md,
      borderWidth: 2,
      borderColor: theme.colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: theme.spacing.md,
      marginBottom: theme.spacing.md,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 2,
    },
    colorSwatchSelected: {
      borderColor: theme.colors.primary,
      borderWidth: 3,
    },
    checkmark: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkmarkText: {
      color: theme.colors.primary,
      fontSize: theme.typography.sizes.body,
      fontWeight: theme.typography.weights.bold,
    },
    customColorContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
    },
    colorPreview: {
      width: 50,
      height: 50,
      borderRadius: theme.borderRadius.md,
      borderWidth: 2,
      borderColor: theme.colors.border,
    },
    colorInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      fontSize: theme.typography.sizes.body,
      color: theme.colors.text,
      backgroundColor: theme.colors.background,
      fontFamily: theme.typography.fonts.monospace,
      marginHorizontal: theme.spacing.md,
    },
    applyButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
    },
    applyButtonText: {
      color: theme.colors.surface,
      fontSize: theme.typography.sizes.body,
      fontWeight: theme.typography.weights.semibold,
    },
    closeButton: {
      marginTop: theme.spacing.md,
      padding: theme.spacing.md,
      alignItems: 'center',
    },
    closeButtonText: {
      color: theme.colors.textSecondary,
      fontSize: theme.typography.sizes.body,
      fontWeight: theme.typography.weights.medium,
    },
  });
