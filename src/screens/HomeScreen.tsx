import React, {useEffect, useState, useRef, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  AppState,
  AppStateStatus,
  RefreshControl,
  TouchableOpacity
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {StorageService} from '../services/storage';
import {SchedulingService} from '../services/schedulingService';
import {BibleService} from '../services/bibleService';
import {BibleVerse, VerseDisplay, ScheduledVerse} from '../types';
import {useTheme} from '../theme/useTheme';
import {getShadowOpacity} from '../theme/utils';
import WidgetDataManager from '../native/WidgetDataManager';
import {TopographyBackground} from '../components/TopographyBackground';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const CARD_GAP = 0; // No gap between cards
const MIN_CARD_HEIGHT = 180; // Minimum card height for calculations

export const HomeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const [allVerses, setAllVerses] = useState<VerseDisplay[]>([]);
  const [scheduledVerses, setScheduledVerses] = useState<ScheduledVerse[]>([]);
  const [snapOffsets, setSnapOffsets] = useState<number[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const cardHeights = useRef<Map<number, number>>(new Map());
  const cardPositions = useRef<Map<number, number>>(new Map());

  const getRandomVerse = (): BibleVerse | null => {
    try {
      // Only select from New Testament books
      const books = BibleService.getNewTestamentBooks();
      if (books.length === 0) return null;
      const randomBook = books[Math.floor(Math.random() * books.length)];
      const chapters = BibleService.getChapters(randomBook);
      if (chapters.length === 0) return null;
      const randomChapter =
        chapters[Math.floor(Math.random() * chapters.length)];
      const verses = BibleService.getVersesInChapter(
        randomBook,
        randomChapter,
      );
      if (verses.length === 0) return null;
      return verses[Math.floor(Math.random() * verses.length)];
    } catch (error) {
      console.error('Error getting random verse:', error);
      return null;
    }
  };

  const initializeVerseIfNeeded = useCallback(async () => {
    const current = await StorageService.getCurrentVerse();
    if (!current) {
      const randomVerse = getRandomVerse();
      if (randomVerse) {
        await StorageService.setCurrentVerse(randomVerse);
        await StorageService.addDisplayedVerse(randomVerse);
        try {
          await WidgetDataManager.updateVerse(
            randomVerse.text,
            randomVerse.reference,
          );
        } catch (error) {
          console.error('Error updating widget:', error);
        }
        // Return the verse so we can immediately update React state
        return randomVerse;
      }
    }
    return null;
  }, []);

  const loadData = useCallback(async () => {
    // First, ensure we have a verse initialized before loading data
    const newlyCreatedVerse = await initializeVerseIfNeeded();
    
    // Parallelize data loading operations
    const [displayed, scheduled] = await Promise.all([
      StorageService.getDisplayedVerses(),
      StorageService.getScheduledVerses(),
    ]);
    
    // If we just created a verse, immediately add it to state
    let versesToDisplay: VerseDisplay[] = displayed;
    if (newlyCreatedVerse) {
      const newVerseDisplay: VerseDisplay = {
        verse: newlyCreatedVerse,
        displayedAt: new Date(),
      };
      // Add the new verse at the beginning and ensure it's in the list
      versesToDisplay = [newVerseDisplay, ...displayed];
    } else if (displayed.length === 0) {
      // Fallback: if we still have no displayed verses, create one
      const randomVerse = getRandomVerse();
      if (randomVerse) {
        await StorageService.setCurrentVerse(randomVerse);
        await StorageService.addDisplayedVerse(randomVerse);
        const newVerseDisplay: VerseDisplay = {
          verse: randomVerse,
          displayedAt: new Date(),
        };
        versesToDisplay = [newVerseDisplay];
        // Also reload from storage to ensure consistency
        const updatedDisplayed = await StorageService.getDisplayedVerses();
        versesToDisplay = updatedDisplayed;
      }
    }
    
    // Sort by most recent first (newest at top)
    const sorted = versesToDisplay.sort(
      (a, b) => b.displayedAt.getTime() - a.displayedAt.getTime(),
    );
    setAllVerses(sorted.slice(0, 30));
    
    // Filter out past due scheduled verses and sort by scheduled time (earliest first)
    const now = new Date();
    const upcomingScheduled = scheduled.filter(
      (v) => v.scheduledFor.getTime() > now.getTime()
    );
    const sortedScheduled = upcomingScheduled.sort(
      (a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime(),
    );
    setScheduledVerses(sortedScheduled);
    
    // Mark initialization as complete
    setIsInitializing(false);
  }, [initializeVerseIfNeeded]);

  const handleUnscheduleVerse = useCallback(async (id: string) => {
    try {
      await StorageService.removeScheduledVerse(id);
      // Update state to remove the unscheduled verse
      setScheduledVerses(prevVerses => prevVerses.filter(v => v.id !== id));
    } catch (error) {
      console.error('Error unscheduling verse:', error);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Get a new random verse
      const randomVerse = getRandomVerse();
      if (randomVerse) {
        // Save to storage
        await StorageService.setCurrentVerse(randomVerse);
        await StorageService.addDisplayedVerse(randomVerse);
        
        // Update widget
        try {
          await WidgetDataManager.updateVerse(
            randomVerse.text,
            randomVerse.reference,
          );
        } catch (error) {
          console.error('Error updating widget:', error);
        }
        
        // Immediately add to React state
        const newVerseDisplay: VerseDisplay = {
          verse: randomVerse,
          displayedAt: new Date(),
        };
        
        // Add new verse at the beginning of the list
        setAllVerses(prevVerses => {
          const updated = [newVerseDisplay, ...prevVerses];
          return updated.slice(0, 30); // Keep only last 30
        });
      }
    } catch (error) {
      console.error('Error refreshing verse:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      SchedulingService.updateWidgetWithNextVerse().then(() => loadData());
    }, 60000);
    
    // Reload data when app comes to foreground to show newly updated verses
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // App has come to foreground, reload data to show any new verses
        loadData();
      }
    };
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [loadData]);

  // Reload scheduled verses when screen comes into focus
  // This ensures newly scheduled verses appear immediately when navigating back to HomeScreen
  useFocusEffect(
    useCallback(() => {
      // Reload scheduled verses when screen focuses
      const reloadScheduledVerses = async () => {
        const scheduled = await StorageService.getScheduledVerses();
        // Filter out past due scheduled verses
        const now = new Date();
        const upcomingScheduled = scheduled.filter(
          (v) => v.scheduledFor.getTime() > now.getTime()
        );
        const sortedScheduled = upcomingScheduled.sort(
          (a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime(),
        );
        setScheduledVerses(sortedScheduled);
      };
      reloadScheduledVerses();
    }, [])
  );

  // Also reload scheduled verses periodically to catch any updates immediately
  // This ensures newly scheduled verses appear even if user is already on HomeScreen
  useEffect(() => {
    const reloadInterval = setInterval(async () => {
      const scheduled = await StorageService.getScheduledVerses();
      // Filter out past due scheduled verses
      const now = new Date();
      const upcomingScheduled = scheduled.filter(
        (v) => v.scheduledFor.getTime() > now.getTime()
      );
      const sortedScheduled = upcomingScheduled.sort(
        (a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime(),
      );
      setScheduledVerses(sortedScheduled);
    }, 500); // Check every 500ms for new scheduled verses for near-instant updates

    return () => clearInterval(reloadInterval);
  }, []);


  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatScheduledTime = (date: Date): string => {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    
    if (diffMs < 0) {
      return 'Past due';
    }
    
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 60) {
      return `In ${diffMins}m`;
    } else if (diffHours < 24) {
      return `In ${diffHours}h`;
    } else if (diffDays < 7) {
      return `In ${diffDays}d`;
    } else {
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    }
  };

  const styles = createStyles(theme);
  const topPad = insets.top + theme.safeArea.topPadding;
  const paddingTop = topPad;

  return (
    <View style={styles.container}>
      <TopographyBackground />
      {(scheduledVerses.length > 0 || allVerses.length > 0 || isInitializing) ? (
        <Animated.ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.contentContainer,
            {
              paddingTop: paddingTop,
              paddingBottom:
                insets.bottom +
                theme.safeArea.tabBarHeight +
                theme.safeArea.bottomPadding,
            },
          ]}
          showsVerticalScrollIndicator={false}
          decelerationRate="fast"
          onScroll={Animated.event(
            [{nativeEvent: {contentOffset: {y: scrollY}}}],
            {useNativeDriver: true},
          )}
          scrollEventThrottle={16}
          snapToOffsets={snapOffsets.length > 0 ? snapOffsets : undefined}
          snapToAlignment="start"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }>
          {/* Scheduled Verses Section */}
          {scheduledVerses.length > 0 && (
            <View style={styles.scheduledSection}>
              <Text style={styles.sectionTitle}>Scheduled Verses</Text>
              {scheduledVerses.map((scheduled) => (
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
                    <TouchableOpacity
                      onPress={() => handleUnscheduleVerse(scheduled.id)}
                      style={styles.unscheduleButton}
                      hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                      <Text style={styles.unscheduleButtonText}>×</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.scheduledText} numberOfLines={2}>
                    {scheduled.verse.text}
                  </Text>
                </View>
              ))}
            </View>
          )}
          
          {/* Displayed Verses Section */}
          {allVerses.length > 0 && scheduledVerses.length > 0 && (
            <View style={styles.divider} />
          )}
          
          {allVerses.map((display, index) => {
            // Use actual measured positions from onLayout (same as snap offsets)
            const cardY = cardPositions.current.get(index);
            const cardHeight = cardHeights.current.get(index) || MIN_CARD_HEIGHT + 100;
            
            // If we don't have measured position yet, use fallback calculation
            let cardTop = cardY;
            if (cardTop === undefined) {
              // Fallback: calculate from heights
              cardTop = 0;
              for (let i = 0; i < index; i++) {
                cardTop += cardHeights.current.get(i) || MIN_CARD_HEIGHT + 100;
              }
            }
            
            // Input range based on card top position (where it snaps)
            // When scrolled to card top, scrollY = cardTop - paddingTop
            // This MUST match the snap offset calculation exactly
            const snapPosition = cardTop - paddingTop;
            const inputRange = [
              snapPosition - cardHeight * 1.2,
              snapPosition - cardHeight * 0.6,
              snapPosition - cardHeight * 0.2,
              snapPosition,
              snapPosition + cardHeight * 0.2,
              snapPosition + cardHeight * 0.6,
              snapPosition + cardHeight * 1.2,
            ];

            // Scale: keep center card at full size longer, gradual falloff
            const scale = scrollY.interpolate({
              inputRange,
              outputRange: [0.8, 0.9, 0.95, 1, 0.95, 0.9, 0.8],
              extrapolate: 'clamp',
            });

            // Opacity: keep center card fully visible longer
            const opacity = scrollY.interpolate({
              inputRange,
              outputRange: [0.3, 0.6, 0.85, 1, 0.85, 0.6, 0.3],
              extrapolate: 'clamp',
            });

            // Vertical translation: subtle movement
            const translateY = scrollY.interpolate({
              inputRange,
              outputRange: [15, 8, 3, 0, -3, -8, -15],
              extrapolate: 'clamp',
            });

            // Rotation: subtle wheel effect, less aggressive
            const rotateX = scrollY.interpolate({
              inputRange,
              outputRange: ['5deg', '2deg', '0.5deg', '0deg', '-0.5deg', '-2deg', '-5deg'],
              extrapolate: 'clamp',
            });

            return (
              <Animated.View
                key={`${display.verse.reference}-${index}`}
                onLayout={(event) => {
                  const {height, y} = event.nativeEvent.layout;
                  if (height > 0) {
                    cardHeights.current.set(index, height);
                    cardPositions.current.set(index, y);
                    
                    // Calculate snap offsets to align top of each card with viewport top
                    // y from onLayout is relative to contentContainer (starts at 0, includes paddingTop in layout)
                    // For snap scrolling, we want scroll positions where each card's top aligns with viewport top
                    const offsets: number[] = [];
                    
                    // Collect all card positions and heights first
                    const cardData: Array<{y: number; height: number}> = [];
                    for (let i = 0; i < allVerses.length; i++) {
                      const cardYPos = cardPositions.current.get(i);
                      const cardH = cardHeights.current.get(i);
                      if (cardYPos !== undefined && cardH !== undefined) {
                        cardData.push({y: cardYPos, height: cardH});
                      }
                    }
                    
                    // Calculate snap offsets for each card
                    // IMPORTANT: This calculation must match the snapPosition in animations above
                    for (let i = 0; i < cardData.length; i++) {
                      const {y: cardYPos} = cardData[i];
                      // Card's top position in content (y is relative to contentContainer)
                      // To align card top with viewport top, scroll offset = cardYPos - paddingTop
                      // When scrollY = 0, content at paddingTop is at viewport top
                      // This is the exact same calculation as snapPosition in the animation
                      const scrollOffset = Math.max(0, cardYPos - paddingTop);
                      offsets.push(scrollOffset);
                    }
                    
                    // Update snap offsets when we have all card measurements
                    if (cardData.length === allVerses.length) {
                      setSnapOffsets(offsets);
                    }
                  }
                }}
                style={[
                  styles.carouselCard,
                  {
                    minHeight: MIN_CARD_HEIGHT,
                    marginBottom: CARD_GAP,
                    transform: [{scale}, {translateY}, {perspective: 800}, {rotateX}],
                    opacity,
                  },
                ]}>
                {/* Timestamp - part of content flow */}
                <Text style={styles.cardTimestamp}>
                  {formatTimeAgo(display.displayedAt)}
                </Text>

                {/* Reference */}
                <Text style={styles.cardReference}>
                  {display.verse.reference}
                </Text>

                {/* Verse text - full text, no truncation */}
                <Text style={styles.cardText}>
                  {display.verse.text}
                </Text>
              </Animated.View>
            );
          })}
        </Animated.ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No verses yet</Text>
        </View>
      )}
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
    scrollView: {
      flex: 1,
    },
    contentContainer: {
      alignItems: 'center',
    },
    carouselCard: {
      width: SCREEN_WIDTH - theme.spacing.lg * 2,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing.xl,
      justifyContent: 'flex-start',
      flexShrink: 0,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 6},
      shadowOpacity: getShadowOpacity(theme.colors.background) * 1.2,
      shadowRadius: 16,
      elevation: 8,
      borderWidth: 0.5,
      borderColor: theme.colors.border,
    },
    cardTimestamp: {
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.textTertiary,
      opacity: 0.6,
      letterSpacing: theme.typography.letterSpacing.normal,
      marginBottom: theme.spacing.sm,
    },
    cardReference: {
      fontSize: theme.typography.sizes.sm,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.primary,
      marginBottom: theme.spacing.md,
      letterSpacing: theme.typography.letterSpacing.wide,
      textTransform: 'uppercase',
    },
    cardText: {
      fontSize: theme.typography.sizes.xl,
      lineHeight:
        theme.typography.sizes.xl * theme.typography.lineHeights.relaxed,
      color: theme.colors.text,
      fontFamily: theme.typography.fonts.serif,
      letterSpacing: theme.typography.letterSpacing.normal,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyText: {
      fontSize: theme.typography.sizes.body,
      color: theme.colors.textTertiary,
      fontFamily: theme.typography.fonts.regular,
      textAlign: 'center',
    },
    scheduledSection: {
      width: SCREEN_WIDTH - theme.spacing.lg * 2,
      marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
      fontSize: theme.typography.sizes.lg,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
    },
    scheduledCard: {
      backgroundColor: theme.colors.surfaceElevated,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
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
      lineHeight: theme.typography.sizes.body * theme.typography.lineHeights.relaxed,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginVertical: theme.spacing.lg,
      width: SCREEN_WIDTH - theme.spacing.lg * 2,
    },
  });
