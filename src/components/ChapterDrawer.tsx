import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Animated,
  PanResponder,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {BibleService} from '../services/bibleService';
import {useTheme} from '../theme/useTheme';
import {getShadowOpacity} from '../theme/utils';

interface ChapterDrawerProps {
  visible: boolean;
  currentBook: string;
  onBookSelect: (book: string) => void;
  onClose: () => void;
  onOpen?: () => void;
}

export const ChapterDrawer: React.FC<ChapterDrawerProps> = ({
  visible,
  currentBook,
  onBookSelect,
  onClose,
  onOpen,
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const books = BibleService.getAllBooks();
  const slideAnim = React.useRef(new Animated.Value(visible ? 0 : 1)).current;
  const backdropOpacity = React.useRef(new Animated.Value(visible ? 1 : 0)).current;
  const styles = createStyles(theme, insets);

  React.useEffect(() => {
    // Always animate to fully open (0) or fully closed (1) - no intermediate positions
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: visible ? 0 : 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: visible ? 1 : 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, slideAnim, backdropOpacity]);

  const drawerWidth = DRAWER_WIDTH;
  const translateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -drawerWidth],
  });

  // Pan responder for swipe-to-close gesture
  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => visible, // Only respond when drawer is visible
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to horizontal swipes from the drawer area when visible
        return visible && Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && gestureState.dx < 0;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          // Swiping left (closing) - follow finger but clamp to bounds
          const progress = Math.min(Math.max(Math.abs(gestureState.dx) / drawerWidth, 0), 1);
          slideAnim.setValue(progress);
          // Fade backdrop inversely with drawer position
          backdropOpacity.setValue(1 - progress);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const swipeThreshold = drawerWidth * 0.2; // Lower threshold for more sensitivity
        const currentProgress = Math.abs(gestureState.dx) / drawerWidth;
        
        // Determine if we should close or open based on threshold
        const shouldClose = currentProgress > swipeThreshold || gestureState.dx < -drawerWidth * 0.1;
        
        if (shouldClose) {
          // Animate to fully closed
          Animated.parallel([
            Animated.timing(slideAnim, {
              toValue: 1,
              duration: 250,
              useNativeDriver: true,
            }),
            Animated.timing(backdropOpacity, {
              toValue: 0,
              duration: 250,
              useNativeDriver: true,
            }),
          ]).start(() => {
            onClose();
          });
        } else {
          // Animate to fully open
          Animated.parallel([
            Animated.timing(slideAnim, {
              toValue: 0,
              duration: 250,
              useNativeDriver: true,
            }),
            Animated.timing(backdropOpacity, {
              toValue: 1,
              duration: 250,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
    }),
  ).current;

  const handleBookSelect = (book: string) => {
    onBookSelect(book);
    onClose();
  };

  const handleTabPress = () => {
    if (visible) {
      onClose();
    } else if (onOpen) {
      onOpen();
    }
  };

  return (
    <>
      {/* Backdrop with fade animation */}
      <Animated.View
        style={[
          styles.backdrop,
          {
            opacity: backdropOpacity,
          },
        ]}
        pointerEvents={visible ? 'auto' : 'none'}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
      </Animated.View>

      {/* Drawer */}
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.drawer,
          {
            transform: [{translateX}],
            width: drawerWidth,
          },
        ]}>
        {/* Tab handle - part of drawer, moves with drawer */}
        <TouchableOpacity
          style={styles.tabHandle}
          onPress={handleTabPress}
          activeOpacity={0.7}>
          <View style={styles.tabIndicator} />
        </TouchableOpacity>

        <View style={styles.drawerHeader}>
          <Text style={styles.drawerTitle}>Books</Text>
          <Text style={styles.drawerSubtitle}>
            {books.length} Books
          </Text>
        </View>

        <FlatList
          data={books}
          keyExtractor={item => item}
          contentContainerStyle={styles.booksList}
          renderItem={({item}) => {
            const isSelected = item === currentBook;
            return (
              <TouchableOpacity
                style={[
                  styles.bookItem,
                  isSelected && styles.bookItemSelected,
                ]}
                onPress={() => handleBookSelect(item)}>
                <Text
                  style={[
                    styles.bookItemText,
                    isSelected && styles.bookItemTextSelected,
                  ]}>
                  {item}
                </Text>
                {isSelected && <View style={styles.selectedIndicator} />}
              </TouchableOpacity>
            );
          }}
        />
      </Animated.View>
    </>
  );
};

const DRAWER_WIDTH = 280;

const createStyles = (theme: any, insets: any) =>
  StyleSheet.create({
    backdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 998,
    },
    drawer: {
      position: 'absolute',
      top: 0,
      left: 0,
      bottom: 0,
      backgroundColor: theme.colors.surface,
      zIndex: 999,
      paddingTop: insets.top + theme.safeArea.topPadding,
      paddingBottom: insets.bottom + theme.safeArea.bottomPadding,
      shadowColor: '#000',
      shadowOffset: {width: 2, height: 0},
      shadowOpacity: getShadowOpacity(theme.colors.background),
      shadowRadius: 8,
      elevation: 8,
    },
    tabHandle: {
      position: 'absolute',
      left: DRAWER_WIDTH, // Position at right edge of drawer (moves with drawer)
      top: '50%',
      marginTop: -30,
      width: 24,
      height: 60,
      backgroundColor: theme.colors.surface,
      borderTopRightRadius: theme.borderRadius.md,
      borderBottomRightRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderLeftWidth: 0,
      borderColor: theme.colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {width: 2, height: 0},
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
      zIndex: 1000,
    },
    tabIndicator: {
      width: 4,
      height: 24,
      backgroundColor: theme.colors.textSecondary,
      borderRadius: 2,
    },
    drawerHeader: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.xl,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    drawerTitle: {
      fontSize: theme.typography.sizes.xl,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    drawerSubtitle: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.textSecondary,
    },
    booksList: {
      padding: theme.spacing.md,
    },
    bookItem: {
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.xs,
      backgroundColor: theme.colors.surfaceElevated,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    bookItemSelected: {
      backgroundColor: theme.colors.primary,
    },
    bookItemText: {
      fontSize: theme.typography.sizes.body,
      fontWeight: theme.typography.weights.medium,
      color: theme.colors.text,
    },
    bookItemTextSelected: {
      color: theme.colors.surface,
      fontWeight: theme.typography.weights.bold,
    },
    selectedIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.surface,
    },
  });
