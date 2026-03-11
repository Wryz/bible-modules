import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {BibleService} from '../services/bibleService';
import {ChapterProgress} from '../types';
import {useTheme} from '../theme/useTheme';
import {getShadowOpacity, withOpacity} from '../theme/utils';
import {ChevronDownIcon} from './icons/ChevronDownIcon';
import {useProgress} from '../context/ProgressContext';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const TILE_GAP = 10;
const TILES_PER_ROW = 5;

type HomeStackParamList = {
  HomeMain: undefined;
  ChapterList: {bookName: string};
  VersePractice: {bookName: string; chapter: number};
};

interface FocusBookHeaderProps {
  onBookChanged?: (book: string) => void;
}

export const FocusBookHeader: React.FC<FocusBookHeaderProps> = ({
  onBookChanged,
}) => {
  const theme = useTheme();
  const navigation = useNavigation<StackNavigationProp<HomeStackParamList>>();
  const {
    focusedBook,
    setFocusedBook,
    getChapterProgressList,
    getAllBooksProgress,
  } = useProgress();
  const [picking, setPicking] = useState(false);

  const allBooks = BibleService.getAllBooks();
  const chapterProgress = getChapterProgressList(focusedBook);
  const allBooksProgress = getAllBooksProgress();

  let totalCompleted = 0;
  let totalVerses = 0;
  for (const cp of chapterProgress) {
    totalVerses += cp.totalVerses;
    totalCompleted += cp.completedVerses;
  }

  const handleTogglePicker = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setPicking(prev => !prev);
  };

  const handleBookSelect = async (book: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setPicking(false);
    await setFocusedBook(book);
    onBookChanged?.(book);
  };

  const overallPct = totalVerses > 0 ? totalCompleted / totalVerses : 0;

  const styles = createStyles(theme);
  const horizontalPad = theme.spacing.lg;
  const availableWidth = SCREEN_WIDTH - horizontalPad * 2;
  const tileSize =
    (availableWidth - TILE_GAP * (TILES_PER_ROW - 1)) / TILES_PER_ROW;

  const getTileStyle = (cp: ChapterProgress) => {
    if (cp.totalVerses > 0 && cp.completedVerses >= cp.totalVerses) {
      return {
        backgroundColor: withOpacity(theme.colors.success, 0.2),
        borderColor: theme.colors.success,
        borderWidth: 1.5,
      };
    }
    if (cp.startedVerses > 0) {
      return {
        backgroundColor: withOpacity(theme.colors.primary, 0.12),
        borderColor: theme.colors.primary,
        borderWidth: 1.5,
      };
    }
    return {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderWidth: 0.5,
    };
  };

  const matthewIdx = allBooks.indexOf('Matthew');
  const otBooks = matthewIdx > 0 ? allBooks.slice(0, matthewIdx) : allBooks;
  const ntBooks = matthewIdx > 0 ? allBooks.slice(matthewIdx) : [];

  return (
    <View style={styles.container}>
      {/* Header row */}
      <TouchableOpacity
        style={styles.bookSelector}
        activeOpacity={0.7}
        onPress={handleTogglePicker}>
        <Text style={styles.bookName} numberOfLines={1}>
          {focusedBook || 'Select a book'}
        </Text>
        <View style={picking && styles.chevronFlipped}>
          <ChevronDownIcon size={20} color={theme.colors.text} />
        </View>
      </TouchableOpacity>

      {picking ? (
        <View style={styles.bookListContainer}>
          <Text style={styles.sectionLabel}>Old Testament</Text>
          {otBooks.map(name => {
            const isCurrent = name === focusedBook;
            const prog = allBooksProgress.get(name);
            const pct =
              prog && prog.total > 0
                ? Math.round((prog.completed / prog.total) * 100)
                : 0;
            return (
              <TouchableOpacity
                key={name}
                style={[styles.bookItem, isCurrent && styles.bookItemSelected]}
                activeOpacity={0.7}
                onPress={() => handleBookSelect(name)}>
                <Text
                  style={[
                    styles.bookItemText,
                    isCurrent && styles.bookItemTextSelected,
                  ]}>
                  {name}
                </Text>
                <Text
                  style={[
                    styles.bookItemProgress,
                    isCurrent && styles.bookItemProgressSelected,
                  ]}>
                  {pct}% mastered
                </Text>
              </TouchableOpacity>
            );
          })}

          {ntBooks.length > 0 && (
            <>
              <Text style={[styles.sectionLabel, styles.sectionLabelNT]}>
                New Testament
              </Text>
              {ntBooks.map(name => {
                const isCurrent = name === focusedBook;
                const prog = allBooksProgress.get(name);
                const pct =
                  prog && prog.total > 0
                    ? Math.round((prog.completed / prog.total) * 100)
                    : 0;
                return (
                  <TouchableOpacity
                    key={name}
                    style={[
                      styles.bookItem,
                      isCurrent && styles.bookItemSelected,
                    ]}
                    activeOpacity={0.7}
                    onPress={() => handleBookSelect(name)}>
                    <Text
                      style={[
                        styles.bookItemText,
                        isCurrent && styles.bookItemTextSelected,
                      ]}>
                      {name}
                    </Text>
                    <Text
                      style={[
                        styles.bookItemProgress,
                        isCurrent && styles.bookItemProgressSelected,
                      ]}>
                      {pct}% mastered
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </>
          )}
        </View>
      ) : (
        focusedBook && (
          <View style={styles.chapterContent}>
            <View style={styles.statsRow}>
              <Text style={styles.statsText}>
                {chapterProgress.length} chapter
                {chapterProgress.length !== 1 ? 's' : ''}
                {'  ·  '}
                {totalVerses} verse{totalVerses !== 1 ? 's' : ''}
              </Text>
              {overallPct > 0 && (
                <Text style={styles.statsPct}>
                  {Math.round(overallPct * 100)}% mastered
                </Text>
              )}
            </View>

            {overallPct > 0 && (
              <View style={styles.overallBarOuter}>
                <View
                  style={[
                    styles.overallBarInner,
                    {
                      width: `${Math.max(overallPct * 100, 1)}%`,
                      backgroundColor:
                        overallPct >= 1
                          ? theme.colors.success
                          : theme.colors.primary,
                    },
                  ]}
                />
              </View>
            )}

            <View style={styles.grid}>
              {chapterProgress.map(cp => {
                const tileExtra = getTileStyle(cp);
                const isComplete =
                  cp.totalVerses > 0 &&
                  cp.completedVerses >= cp.totalVerses;
                return (
                  <TouchableOpacity
                    key={cp.chapter}
                    style={[
                      styles.tile,
                      {width: tileSize, height: tileSize},
                      tileExtra,
                    ]}
                    activeOpacity={0.7}
                    onPress={() =>
                      navigation.navigate('VersePractice', {
                        bookName: focusedBook,
                        chapter: cp.chapter,
                      })
                    }>
                    <Text
                      style={[
                        styles.tileNumber,
                        isComplete && {color: theme.colors.success},
                        cp.startedVerses > 0 &&
                          !isComplete && {color: theme.colors.primary},
                      ]}>
                      {cp.chapter}
                    </Text>
                    {cp.startedVerses > 0 && !isComplete && (
                      <Text style={styles.tileSub}>
                        {cp.completedVerses}/{cp.totalVerses}
                      </Text>
                    )}
                    {isComplete && (
                      <Text style={styles.tileCheck}>✓</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )
      )}
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.lg,
    },
    bookSelector: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: theme.spacing.xs,
      marginBottom: theme.spacing.sm,
    },
    bookName: {
      fontSize: theme.typography.sizes.xxl,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.text,
      letterSpacing: theme.typography.letterSpacing.tight,
    },
    chevronFlipped: {
      transform: [{rotate: '180deg'}],
    },

    bookListContainer: {
      marginTop: theme.spacing.sm,
    },
    sectionLabel: {
      fontSize: theme.typography.sizes.sm,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.textSecondary,
      letterSpacing: theme.typography.letterSpacing.wide,
      textTransform: 'uppercase',
      marginBottom: theme.spacing.sm,
      marginTop: theme.spacing.xs,
    },
    sectionLabelNT: {
      marginTop: theme.spacing.lg,
    },
    bookItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.xs,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    bookItemSelected: {
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: theme.colors.primary,
    },
    bookItemText: {
      fontSize: theme.typography.sizes.body,
      fontWeight: theme.typography.weights.medium,
      color: theme.colors.text,
    },
    bookItemTextSelected: {
      color: theme.colors.primary,
    },
    bookItemProgress: {
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.textSecondary,
      fontWeight: theme.typography.weights.medium,
    },
    bookItemProgressSelected: {
      color: theme.colors.primary,
    },

    chapterContent: {
      marginTop: theme.spacing.xs,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    statsText: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.textSecondary,
    },
    statsPct: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.primary,
      fontWeight: theme.typography.weights.medium,
    },
    overallBarOuter: {
      width: '100%',
      height: 6,
      borderRadius: 3,
      backgroundColor: withOpacity(theme.colors.primary, 0.15),
      overflow: 'hidden',
      marginBottom: theme.spacing.lg,
    },
    overallBarInner: {
      height: '100%',
      borderRadius: 3,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: TILE_GAP,
    },
    tile: {
      borderRadius: theme.borderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: getShadowOpacity(theme.colors.background) * 0.5,
      shadowRadius: 2,
      elevation: 1,
    },
    tileNumber: {
      fontSize: theme.typography.sizes.lg,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.text,
    },
    tileSub: {
      fontSize: 10,
      color: theme.colors.primary,
      marginTop: 2,
    },
    tileCheck: {
      fontSize: 12,
      color: theme.colors.success,
      fontWeight: theme.typography.weights.bold,
      marginTop: 1,
    },
  });
