import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Platform,
  Animated,
} from 'react-native';
import {BibleVerse} from '../types';
import {useTheme} from '../theme/useTheme';
import {useVerseScheduling} from '../hooks/useVerseScheduling';

// Import clipboard
import Clipboard from '@react-native-clipboard/clipboard';

interface VerseActionSheetProps {
  visible: boolean;
  verse: BibleVerse | null;
  onClose: () => void;
  onScheduleComplete?: () => void;
}

export const VerseActionSheet: React.FC<VerseActionSheetProps> = ({
  visible,
  verse,
  onClose,
  onScheduleComplete,
}) => {
  const theme = useTheme();
  const {scheduleVerse} = useVerseScheduling();
  const styles = createStyles(theme);
  const slideAnim = useRef(new Animated.Value(visible ? 0 : 1)).current;
  const backdropOpacity = useRef(new Animated.Value(visible ? 1 : 0)).current;

  useEffect(() => {
    if (visible) {
      // Fade backdrop first, then slide drawer
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
      ]).start();
    } else {
      // Slide drawer first, then fade backdrop
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, backdropOpacity]);

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 300],
  });

  const handleSchedule = async (daysOffset: number = 0) => {
    if (!verse) return;

    const scheduledDate = new Date();
    scheduledDate.setDate(scheduledDate.getDate() + daysOffset);
    scheduledDate.setHours(9, 0, 0, 0); // Default to 9 AM

    await scheduleVerse(verse, scheduledDate);
    onScheduleComplete?.();
    onClose();
  };

  const handleCopy = async () => {
    if (!verse) return;

    const textToCopy = `${verse.reference}\n${verse.text}`;
    
    try {
      if (Clipboard && Clipboard.setString) {
        await Clipboard.setString(textToCopy);
      } else {
        console.warn('Clipboard functionality not available. Please rebuild the app after installing @react-native-clipboard/clipboard');
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      // The native module might not be linked - user needs to rebuild
      console.warn('If you see "RNCClipboard could not be found", run: cd ios && pod install && cd .. && npx react-native run-ios');
    }
    
    onClose();
  };

  if (!verse) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View
          style={[
            styles.overlay,
            {
              opacity: backdropOpacity,
            },
          ]}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.container,
                {
                  transform: [{translateY}],
                },
              ]}>
              <View style={styles.handle} />
              <Text style={styles.title}>Verse Options</Text>
              <Text style={styles.reference}>{verse.reference}</Text>

              <View style={styles.optionsContainer}>
                <TouchableOpacity
                  style={styles.option}
                  onPress={() => handleSchedule(0)}>
                  <Text style={styles.optionText}>Schedule for Today</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.option}
                  onPress={() => handleSchedule(1)}>
                  <Text style={styles.optionText}>Schedule for Tomorrow</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.option}
                  onPress={() => handleSchedule(7)}>
                  <Text style={styles.optionText}>Schedule for Next Week</Text>
                </TouchableOpacity>

                <View style={styles.divider} />

                <TouchableOpacity style={styles.option} onPress={handleCopy}>
                  <Text style={styles.optionText}>Copy Verse</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.option, styles.cancelOption]}
                  onPress={onClose}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    container: {
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: theme.borderRadius.xl,
      borderTopRightRadius: theme.borderRadius.xl,
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.xl,
      maxHeight: '80%',
    },
    handle: {
      width: 40,
      height: 4,
      backgroundColor: theme.colors.border,
      borderRadius: theme.borderRadius.full,
      alignSelf: 'center',
      marginBottom: theme.spacing.lg,
    },
    title: {
      fontSize: theme.typography.sizes.lg,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: theme.spacing.xs,
      paddingHorizontal: theme.spacing.lg,
    },
    reference: {
      fontSize: theme.typography.sizes.sm,
      fontWeight: theme.typography.weights.medium,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: theme.spacing.lg,
      paddingHorizontal: theme.spacing.lg,
      letterSpacing: theme.typography.letterSpacing.wide,
      textTransform: 'uppercase',
    },
    optionsContainer: {
      paddingHorizontal: theme.spacing.md,
    },
    option: {
      paddingVertical: theme.spacing.lg,
      paddingHorizontal: theme.spacing.lg,
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.xs,
      backgroundColor: theme.colors.surfaceElevated,
    },
    optionText: {
      fontSize: theme.typography.sizes.body,
      color: theme.colors.text,
      fontWeight: theme.typography.weights.medium,
      textAlign: 'center',
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginVertical: theme.spacing.md,
    },
    cancelOption: {
      backgroundColor: 'transparent',
      marginTop: theme.spacing.sm,
    },
    cancelText: {
      fontSize: theme.typography.sizes.body,
      color: theme.colors.textSecondary,
      fontWeight: theme.typography.weights.medium,
      textAlign: 'center',
    },
  });
