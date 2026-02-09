import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {BibleVerse} from '../types';
import {useTheme} from '../theme/useTheme';
import {VerseActionSheet} from './VerseActionSheet';
import {ArrowLeftIcon} from './icons/ArrowLeftIcon';
import {ArrowRightIcon} from './icons/ArrowRightIcon';

interface ChapterReaderProps {
  verses: BibleVerse[];
  book: string;
  chapter: number;
  onPrevChapter?: () => void;
  onNextChapter?: () => void;
  canGoPrev?: boolean;
  canGoNext?: boolean;
}

export const ChapterReader: React.FC<ChapterReaderProps> = ({
  verses,
  book,
  chapter,
  onPrevChapter,
  onNextChapter,
  canGoPrev = true,
  canGoNext = true,
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [selectedVerse, setSelectedVerse] = useState<BibleVerse | null>(null);
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const styles = createStyles(theme, insets);

  const handleVerseLongPress = (verse: BibleVerse) => {
    setSelectedVerse(verse);
    setActionSheetVisible(true);
  };

  const handleActionSheetClose = () => {
    setActionSheetVisible(false);
    setSelectedVerse(null);
  };

  if (verses.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No verses found</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={true}>
        {/* Book and Chapter Header */}
        <View style={styles.chapterHeader}>
          <Text style={styles.chapterTitle}>
            {book} {chapter}
          </Text>
        </View>

        <View style={styles.versesContainer}>
          {verses.map((verse, index) => (
            <View key={index} style={styles.verseContainer}>
              <Text
                style={styles.verseNumber}
                onLongPress={() => handleVerseLongPress(verse)}>
                {verse.verseNumber}
              </Text>
              <Text
                style={styles.verseText}
                onLongPress={() => handleVerseLongPress(verse)}>
                {verse.text}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Floating Navigation Arrows */}
      {onPrevChapter && onNextChapter && (
        <View style={styles.floatingNavigationBar}>
          <TouchableOpacity
            style={styles.navArrow}
            onPress={onPrevChapter}
            disabled={!canGoPrev}>
            <ArrowLeftIcon
              size={32}
              color={!canGoPrev ? theme.colors.textTertiary : theme.colors.text}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navArrow}
            onPress={onNextChapter}
            disabled={!canGoNext}>
            <ArrowRightIcon
              size={32}
              color={!canGoNext ? theme.colors.textTertiary : theme.colors.text}
            />
          </TouchableOpacity>
        </View>
      )}

      <VerseActionSheet
        visible={actionSheetVisible}
        verse={selectedVerse}
        onClose={handleActionSheetClose}
      />
    </>
  );
};

const createStyles = (theme: any, insets: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    content: {
      paddingTop: insets.top + theme.safeArea.topPadding,
      paddingBottom: insets.bottom + theme.safeArea.bottomPadding + theme.safeArea.tabBarHeight + 100, // Extra space for floating arrows
    },
    floatingNavigationBar: {
      position: 'absolute',
      bottom: insets.bottom + theme.safeArea.tabBarHeight + theme.spacing.md,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.md,
      zIndex: 10,
    },
    navArrow: {
      padding: theme.spacing.sm,
      minWidth: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chapterHeader: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.md,
      marginBottom: theme.spacing.lg,
    },
    chapterTitle: {
      fontSize: theme.typography.sizes.xxl,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.text,
      textAlign: 'center',
      letterSpacing: theme.typography.letterSpacing.tight,
    },
    versesContainer: {
      paddingHorizontal: theme.spacing.lg,
    },
    verseContainer: {
      flexDirection: 'row',
      marginBottom: theme.spacing.md,
      paddingVertical: theme.spacing.xs,
    },
    verseNumber: {
      fontSize: theme.typography.sizes.body,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.primary,
      marginRight: theme.spacing.sm,
      fontFamily: theme.typography.fonts.serif,
      lineHeight: theme.typography.sizes.xl * theme.typography.lineHeights.relaxed,
      minWidth: 24,
      textAlign: 'right',
    },
    verseText: {
      flex: 1,
      fontSize: theme.typography.sizes.xl,
      lineHeight: theme.typography.sizes.xl * theme.typography.lineHeights.relaxed,
      color: theme.colors.text,
      fontFamily: theme.typography.fonts.serif,
      letterSpacing: theme.typography.letterSpacing.normal,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    emptyText: {
      fontSize: theme.typography.sizes.body,
      color: theme.colors.textTertiary,
      fontFamily: theme.typography.fonts.regular,
    },
  });
