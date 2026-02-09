import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  TextInput,
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
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState({hours: 9, minutes: 0});

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

  // Check if scheduling for today would be past due
  const isTodayPastDue = () => {
    const todayAt9AM = new Date();
    todayAt9AM.setHours(9, 0, 0, 0);
    return todayAt9AM.getTime() <= new Date().getTime();
  };

  const handleSchedule = async (daysOffset: number = 0, customDate?: Date) => {
    if (!verse) return;

    let scheduledDate: Date;
    if (customDate) {
      scheduledDate = customDate;
    } else {
      scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + daysOffset);
      scheduledDate.setHours(9, 0, 0, 0); // Default to 9 AM
    }

    await scheduleVerse(verse, scheduledDate);
    // Pass the scheduled verse to the callback so HomeScreen can update immediately
    onScheduleComplete?.();
    onClose();
    setShowDateTimePicker(false);
  };

  const handleCustomSchedule = () => {
    setShowDateTimePicker(true);
  };

  const handleConfirmCustomSchedule = async () => {
    if (!verse) return;

    const scheduledDate = new Date(selectedDate);
    scheduledDate.setHours(selectedTime.hours, selectedTime.minutes, 0, 0);
    
    // Ensure the date is in the future
    const now = new Date();
    if (scheduledDate <= now) {
      // If selected date/time is in the past, schedule for tomorrow at the selected time
      scheduledDate.setDate(scheduledDate.getDate() + 1);
    }

    await handleSchedule(0, scheduledDate);
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
                  style={[
                    styles.option,
                    isTodayPastDue() && styles.optionDisabled
                  ]}
                  onPress={() => !isTodayPastDue() && handleSchedule(0)}
                  disabled={isTodayPastDue()}>
                  <Text style={[
                    styles.optionText,
                    isTodayPastDue() && styles.optionTextDisabled
                  ]}>
                    Schedule for Today
                  </Text>
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

                <TouchableOpacity
                  style={styles.option}
                  onPress={handleCustomSchedule}>
                  <Text style={styles.optionText}>Schedule for Specific Date & Time</Text>
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

      {/* Date/Time Picker Modal */}
      <Modal
        visible={showDateTimePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDateTimePicker(false)}>
        <TouchableWithoutFeedback onPress={() => setShowDateTimePicker(false)}>
          <View style={styles.dateTimePickerOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.dateTimePickerContainer}>
                <Text style={styles.dateTimePickerTitle}>Select Date & Time</Text>
                
                <View style={styles.dateTimeSection}>
                  <Text style={styles.dateTimeLabel}>Date</Text>
                  <View style={styles.datePickerRow}>
                    <TouchableOpacity
                      style={styles.dateButton}
                      onPress={() => {
                        const newDate = new Date(selectedDate);
                        newDate.setDate(newDate.getDate() - 1);
                        setSelectedDate(newDate);
                      }}>
                      <Text style={styles.dateButtonText}>−</Text>
                    </TouchableOpacity>
                    <View style={styles.dateDisplay}>
                      <Text style={styles.dateDisplayText}>
                        {selectedDate.toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.dateButton}
                      onPress={() => {
                        const newDate = new Date(selectedDate);
                        newDate.setDate(newDate.getDate() + 1);
                        setSelectedDate(newDate);
                      }}>
                      <Text style={styles.dateButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.dateTimeSection}>
                  <Text style={styles.dateTimeLabel}>Time</Text>
                  <View style={styles.timeInputRow}>
                    <TextInput
                      style={styles.timeInput}
                      placeholder="HH"
                      value={selectedTime.hours.toString().padStart(2, '0')}
                      onChangeText={(text) => {
                        const hours = parseInt(text, 10);
                        if (!isNaN(hours) && hours >= 0 && hours <= 23) {
                          setSelectedTime({...selectedTime, hours});
                        }
                      }}
                      keyboardType="numeric"
                      maxLength={2}
                      placeholderTextColor={theme.colors.textTertiary}
                    />
                    <Text style={styles.timeSeparator}>:</Text>
                    <TextInput
                      style={styles.timeInput}
                      placeholder="MM"
                      value={selectedTime.minutes.toString().padStart(2, '0')}
                      onChangeText={(text) => {
                        const minutes = parseInt(text, 10);
                        if (!isNaN(minutes) && minutes >= 0 && minutes <= 59) {
                          setSelectedTime({...selectedTime, minutes});
                        }
                      }}
                      keyboardType="numeric"
                      maxLength={2}
                      placeholderTextColor={theme.colors.textTertiary}
                    />
                  </View>
                </View>

                <View style={styles.dateTimePickerButtons}>
                  <TouchableOpacity
                    style={[styles.dateTimeButton, styles.cancelDateTimeButton]}
                    onPress={() => setShowDateTimePicker(false)}>
                    <Text style={styles.cancelDateTimeText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.dateTimeButton, styles.confirmDateTimeButton]}
                    onPress={handleConfirmCustomSchedule}>
                    <Text style={styles.confirmDateTimeText}>Schedule</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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
    optionDisabled: {
      opacity: 0.4,
    },
    optionTextDisabled: {
      color: theme.colors.textTertiary,
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
    dateTimePickerOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.lg,
    },
    dateTimePickerContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing.xl,
      width: '100%',
      maxWidth: 400,
    },
    dateTimePickerTitle: {
      fontSize: theme.typography.sizes.lg,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: theme.spacing.xl,
    },
    dateTimeSection: {
      marginBottom: theme.spacing.lg,
    },
    dateTimeLabel: {
      fontSize: theme.typography.sizes.sm,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.sm,
      textTransform: 'uppercase',
      letterSpacing: theme.typography.letterSpacing.wide,
    },
    datePickerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
    },
    dateButton: {
      width: 44,
      height: 44,
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.surfaceElevated,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    dateButtonText: {
      fontSize: 24,
      color: theme.colors.text,
      fontWeight: theme.typography.weights.bold,
      lineHeight: 24,
    },
    dateDisplay: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: theme.spacing.md,
    },
    dateDisplayText: {
      fontSize: theme.typography.sizes.body,
      color: theme.colors.text,
      fontWeight: theme.typography.weights.medium,
    },
    timeInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    timeInput: {
      width: 60,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      fontSize: theme.typography.sizes.body,
      color: theme.colors.text,
      backgroundColor: theme.colors.background,
      textAlign: 'center',
    },
    timeSeparator: {
      fontSize: theme.typography.sizes.lg,
      color: theme.colors.text,
      fontWeight: theme.typography.weights.bold,
    },
    dateTimePickerButtons: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      marginTop: theme.spacing.lg,
    },
    dateTimeButton: {
      flex: 1,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
    },
    cancelDateTimeButton: {
      backgroundColor: theme.colors.surfaceElevated,
    },
    confirmDateTimeButton: {
      backgroundColor: theme.colors.primary,
    },
    cancelDateTimeText: {
      fontSize: theme.typography.sizes.body,
      color: theme.colors.text,
      fontWeight: theme.typography.weights.medium,
    },
    confirmDateTimeText: {
      fontSize: theme.typography.sizes.body,
      color: '#FFFFFF',
      fontWeight: theme.typography.weights.semibold,
    },
  });
