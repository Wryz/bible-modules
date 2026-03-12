import React, {useState, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  AppState,
  AppStateStatus,
} from 'react-native';
import {Button} from '../components/Button';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {StorageService} from '../services/storage';
import {SchedulingService} from '../services/schedulingService';
import {ScheduledVerse} from '../types';
import {useTheme} from '../theme/useTheme';
import {getShadowOpacity} from '../theme/utils';
import {TopographyBackground} from '../components/TopographyBackground';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

export const ScheduledVersesScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const navigation = useNavigation<StackNavigationProp<any>>();
  const [scheduledVerses, setScheduledVerses] = useState<ScheduledVerse[]>([]);

  const loadScheduled = useCallback(async () => {
    const scheduled = await StorageService.getScheduledVerses();
    const now = new Date();
    const upcoming = scheduled
      .filter(v => v.scheduledFor.getTime() > now.getTime())
      .sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime());
    setScheduledVerses(upcoming);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadScheduled();
    }, [loadScheduled]),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      SchedulingService.updateWidgetWithNextVerse().then(() => loadScheduled());
    }, 60000);

    const subscription = AppState.addEventListener(
      'change',
      (nextAppState: AppStateStatus) => {
        if (nextAppState === 'active') {
          loadScheduled();
        }
      },
    );

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [loadScheduled]);

  // Poll for quick updates
  useEffect(() => {
    const poll = setInterval(loadScheduled, 5000);
    return () => clearInterval(poll);
  }, [loadScheduled]);

  const handleUnschedule = useCallback(async (id: string) => {
    await StorageService.removeScheduledVerse(id);
    setScheduledVerses(prev => prev.filter(v => v.id !== id));
  }, []);

  const formatScheduledTime = (date: Date): string => {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    if (diffMs < 0) return 'Past due';
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffMins < 60) return `In ${diffMins}m`;
    if (diffHours < 24) return `In ${diffHours}h`;
    if (diffDays < 7) return `In ${diffDays}d`;
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const styles = createStyles(theme);
  const topPad = insets.top + theme.safeArea.topPadding;

  return (
    <View style={styles.container}>
      <TopographyBackground />
      <ScrollView
        contentContainerStyle={{
          paddingTop: topPad,
          paddingBottom:
            insets.bottom +
            theme.safeArea.tabBarHeight +
            theme.safeArea.bottomPadding,
          paddingHorizontal: theme.spacing.lg,
        }}
        showsVerticalScrollIndicator={false}>
        <Button
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Settings</Text>
        </Button>

        <Text style={styles.title}>Scheduled Verses</Text>
        <Text style={styles.subtitle}>
          These verses are queued for your widget
        </Text>

        {scheduledVerses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No scheduled verses</Text>
          </View>
        ) : (
          scheduledVerses.map(scheduled => (
            <View key={scheduled.id} style={styles.scheduledCard}>
              <View style={styles.scheduledHeader}>
                <View style={styles.scheduledHeaderLeft}>
                  <Text style={styles.scheduledReference}>
                    {scheduled.verse.reference}
                  </Text>
                  <Text style={styles.scheduledTime}>
                    {formatScheduledTime(scheduled.scheduledFor)}
                  </Text>
                </View>
                <Button
                  onPress={() => handleUnschedule(scheduled.id)}
                  style={styles.unscheduleButton}
                  hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                  <Text style={styles.unscheduleButtonText}>×</Text>
                </Button>
              </View>
              <Text style={styles.scheduledText} numberOfLines={2}>
                {scheduled.verse.text}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      position: 'relative',
    },
    backButton: {
      marginBottom: theme.spacing.sm,
    },
    backText: {
      fontSize: theme.typography.sizes.body,
      color: theme.colors.primary,
      fontWeight: theme.typography.weights.medium,
    },
    title: {
      fontSize: 28,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    subtitle: {
      fontSize: theme.typography.sizes.body,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.lg,
    },
    emptyContainer: {
      paddingVertical: theme.spacing.xxl,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: theme.typography.sizes.body,
      color: theme.colors.textTertiary,
    },
    scheduledCard: {
      backgroundColor: theme.colors.surfaceElevated,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: getShadowOpacity(theme.colors.background) * 0.7,
      shadowRadius: 4,
      elevation: 2,
    },
    scheduledHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.xs,
    },
    scheduledHeaderLeft: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    scheduledReference: {
      fontSize: theme.typography.sizes.sm,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.primary,
      textTransform: 'uppercase',
    },
    scheduledTime: {
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.textSecondary,
      fontWeight: theme.typography.weights.medium,
    },
    unscheduleButton: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: theme.spacing.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    unscheduleButtonText: {
      fontSize: 20,
      color: theme.colors.textSecondary,
      fontWeight: theme.typography.weights.bold,
      lineHeight: 20,
    },
    scheduledText: {
      fontSize: theme.typography.sizes.body,
      color: theme.colors.text,
      fontFamily: theme.typography.fonts.serif,
      lineHeight:
        theme.typography.sizes.body * theme.typography.lineHeights.relaxed,
    },
  });
