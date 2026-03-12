import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  ScrollView,
} from 'react-native';
import {Button} from './Button';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {BibleService} from '../services/bibleService';
import {useTheme} from '../theme/useTheme';
import {getShadowOpacity, withOpacity} from '../theme/utils';

interface ChapterDrawerProps {
  visible: boolean;
  currentBook: string | null;
  currentChapter?: number;
  onBookSelect: (book: string) => void;
  onBookUnselect?: () => void;
  onChapterSelect?: (book: string, chapter: number) => void;
  onClose: () => void;
  onOpen?: () => void;
}

const CHAPTER_BOX_SIZE = 40;
const CHAPTER_GAP = 8;

export const ChapterDrawer: React.FC<ChapterDrawerProps> = ({
  visible,
  currentBook,
  currentChapter,
  onBookSelect,
  onBookUnselect,
  onChapterSelect,
  onClose,
  onOpen,
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const books = BibleService.getAllBooks();
  const [expandedBook, setExpandedBook] = useState<string | null>(currentBook);
  const slideAnim = React.useRef(new Animated.Value(visible ? 0 : 1)).current;
  const backdropOpacity = React.useRef(new Animated.Value(visible ? 1 : 0)).current;
  const styles = createStyles(theme, insets);

  React.useEffect(() => {
    if (visible) {
      setExpandedBook(currentBook);
    }
  }, [visible, currentBook]);

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
    if (expandedBook === book) {
      setExpandedBook(null);
      onBookUnselect?.();
    } else {
      setExpandedBook(book);
      onBookSelect(book);
    }
  };

  const handleChapterSelect = (book: string, chapter: number) => {
    onChapterSelect?.(book, chapter);
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
        <Button
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
        <Button
          style={styles.tabHandle}
          onPress={handleTabPress}
          activeOpacity={0.7}>
          <View style={styles.tabIndicator} />
        </Button>

        <View style={styles.drawerHeader}>
          <Text style={styles.drawerTitle}>Books</Text>
          <Text style={styles.drawerSubtitle}>
            {books.length} Books
          </Text>
        </View>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.booksList}
          showsVerticalScrollIndicator={true}>
          {books.map(book => {
            const isExpanded = expandedBook === book;
            const isCurrent = book === currentBook;
            const chapters = BibleService.getChapters(book);
            return (
              <View key={book} style={styles.bookBlock}>
                <Button
                  style={[
                    styles.bookItem,
                    styles.bookItemOutlined,
                    isCurrent && styles.bookItemCurrent,
                  ]}
                  onPress={() => handleBookSelect(book)}
                  activeOpacity={0.7}>
                  <Text
                    style={[
                      styles.bookItemText,
                      isCurrent && styles.bookItemTextCurrent,
                    ]}>
                    {book}
                  </Text>
                </Button>
                {isExpanded && (
                  <View style={styles.chaptersWrap}>
                    {chapters.map(ch => {
                      const isActive =
                        isCurrent && currentChapter !== undefined && ch === currentChapter;
                      return (
                        <Button
                          key={ch}
                          style={[
                            styles.chapterBox,
                            isActive ? styles.chapterBoxFilled : styles.chapterBoxOutlined,
                          ]}
                          onPress={() => handleChapterSelect(book, ch)}
                          activeOpacity={0.7}>
                          <Text
                            style={[
                              styles.chapterBoxText,
                              isActive ? styles.chapterBoxTextFilled : styles.chapterBoxTextOutlined,
                            ]}>
                            {ch}
                          </Text>
                        </Button>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
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
    scrollArea: {
      flex: 1,
    },
    booksList: {
      padding: theme.spacing.md,
      paddingBottom: theme.spacing.xxl,
    },
    bookBlock: {
      marginBottom: theme.spacing.md,
    },
    bookItem: {
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      borderRadius: theme.borderRadius.md,
      flexDirection: 'row',
      alignItems: 'center',
    },
    bookItemOutlined: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: theme.colors.border,
    },
    bookItemCurrent: {
      borderColor: theme.colors.primary,
      borderWidth: 2,
    },
    bookItemText: {
      fontSize: theme.typography.sizes.body,
      fontWeight: theme.typography.weights.medium,
      color: theme.colors.text,
    },
    bookItemTextCurrent: {
      color: theme.colors.primary,
      fontWeight: theme.typography.weights.semibold,
    },
    chaptersWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: CHAPTER_GAP,
      marginTop: theme.spacing.sm,
      marginLeft: theme.spacing.sm,
    },
    chapterBox: {
      width: CHAPTER_BOX_SIZE,
      height: CHAPTER_BOX_SIZE,
      borderRadius: theme.borderRadius.sm,
      justifyContent: 'center',
      alignItems: 'center',
    },
    chapterBoxFilled: {
      backgroundColor: theme.colors.primary,
    },
    chapterBoxOutlined: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: theme.colors.border,
    },
    chapterBoxText: {
      fontSize: theme.typography.sizes.sm,
      fontWeight: theme.typography.weights.semibold,
    },
    chapterBoxTextFilled: {
      color: theme.colors.surface,
    },
    chapterBoxTextOutlined: {
      color: theme.colors.text,
    },
  });
