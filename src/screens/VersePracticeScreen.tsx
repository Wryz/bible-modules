import React, {useState, useRef, useEffect, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {BibleService} from '../services/bibleService';
import {VerseProgress} from '../types';
import {useTheme} from '../theme/useTheme';
import {getShadowOpacity, withOpacity} from '../theme/utils';
import {TopographyBackground} from '../components/TopographyBackground';
import {useProgress} from '../context/ProgressContext';

const MAX_MASTERY = 4;

type HomeStackParamList = {
  HomeMain: undefined;
  ChapterList: {bookName: string};
  VersePractice: {bookName: string; chapter: number};
};

/**
 * Deterministic seed from a string (simple hash).
 */
function hashSeed(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * Simple seeded PRNG (mulberry32).
 */
function seededRandom(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Split verse text into word tokens, preserving punctuation attached to words.
 */
function tokenize(text: string): string[] {
  return text.split(/\s+/).filter(w => w.length > 0);
}

/**
 * Select which word indices to blank given mastery level and a seed.
 * Level 1: ~25%, Level 2: ~50%, Level 3: ~75%, Level 4: 100%.
 */
function selectBlanks(
  words: string[],
  level: number,
  seed: number,
): Set<number> {
  if (level <= 0) return new Set();
  if (level >= MAX_MASTERY) {
    return new Set(words.map((_, i) => i));
  }
  const fraction = level * 0.25;
  const count = Math.max(1, Math.round(words.length * fraction));
  const rng = seededRandom(seed);

  // Build shuffled indices
  const indices = words.map((_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return new Set(indices.slice(0, count));
}

/**
 * Normalize a word for comparison: lowercase, strip all non-alphanumeric chars.
 * Handles apostrophes ("don't"), hyphens ("twenty-one"), trailing punctuation ("word.")
 */
function normalizeWord(w: string): string {
  return w.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export const VersePracticeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const navigation = useNavigation<StackNavigationProp<HomeStackParamList>>();
  const route = useRoute<RouteProp<HomeStackParamList, 'VersePractice'>>();
  const {bookName, chapter} = route.params;

  const {getVerseProgressForChapter, saveVerseProgress: ctxSaveProgress} =
    useProgress();

  const verses = useMemo(
    () => BibleService.getVersesInChapter(bookName, chapter),
    [bookName, chapter],
  );

  const progressMap = useMemo(() => {
    const prog = getVerseProgressForChapter(bookName, chapter);
    const map = new Map<number, VerseProgress>();
    for (const p of prog) {
      map.set(p.verseNumber, p);
    }
    return map;
  }, [getVerseProgressForChapter, bookName, chapter]);

  const [activeVerseIdx, setActiveVerseIdx] = useState(0);
  const [answers, setAnswers] = useState<Map<number, string>>(new Map());
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<Map<number, boolean>>(new Map());
  const inputRefs = useRef<Map<number, TextInput>>(new Map());
  const [reviewLevel, setReviewLevel] = useState<number | null>(null);

  const activeVerse = verses[activeVerseIdx] || null;
  const activeProgress = activeVerse
    ? progressMap.get(activeVerse.verseNumber) || null
    : null;
  const currentLevel = activeProgress ? activeProgress.masteryLevel : 0;
  const isMastered = currentLevel >= MAX_MASTERY;
  const practiceLevel = isMastered && reviewLevel != null
    ? reviewLevel
    : Math.min(currentLevel + 1, MAX_MASTERY);

  const words = useMemo(
    () => (activeVerse ? tokenize(activeVerse.text) : []),
    [activeVerse],
  );

  const blankIndices = useMemo(() => {
    if (!activeVerse) return new Set<number>();
    const seed = hashSeed(
      `${activeVerse.book}:${activeVerse.chapter}:${activeVerse.verseNumber}:${practiceLevel}`,
    );
    return selectBlanks(words, practiceLevel, seed);
  }, [activeVerse, words, practiceLevel]);

  useEffect(() => {
    setAnswers(new Map());
    setSubmitted(false);
    setResults(new Map());
    setReviewLevel(null);
    inputRefs.current.clear();
  }, [activeVerseIdx, verses]);

  const handleKeyPress = (blankIdx: number, e: {nativeEvent: {key: string}}) => {
    if (e.nativeEvent.key === 'Backspace' && (answers.get(blankIdx) || '') === '') {
      const sortedBlanks = Array.from(blankIndices).sort((a, b) => a - b);
      const pos = sortedBlanks.indexOf(blankIdx);
      const prevIdx =
        pos > 0 ? sortedBlanks[pos - 1] : null;
      if (prevIdx != null) {
        inputRefs.current.get(prevIdx)?.focus();
      }
    }
  };

  const handleAnswerChange = (blankIdx: number, value: string) => {
    if (value.endsWith(' ')) {
      const withoutSpace = value.slice(0, -1);
      const sortedBlanks = Array.from(blankIndices).sort((a, b) => a - b);
      const pos = sortedBlanks.indexOf(blankIdx);
      const nextIdx =
        pos >= 0 && pos < sortedBlanks.length - 1
          ? sortedBlanks[pos + 1]
          : null;
      setAnswers(prev => {
        const n = new Map(prev);
        n.set(blankIdx, withoutSpace);
        return n;
      });
      if (nextIdx != null) {
        setTimeout(() => inputRefs.current.get(nextIdx)?.focus(), 0);
      }
      return;
    }
    setAnswers(prev => {
      const next = new Map(prev);
      next.set(blankIdx, value);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!activeVerse) return;
    const res = new Map<number, boolean>();
    let allCorrect = true;

    for (const idx of blankIndices) {
      const expected = normalizeWord(words[idx]);
      const given = normalizeWord(answers.get(idx) || '');
      const correct = given === expected;
      res.set(idx, correct);
      if (!correct) allCorrect = false;
    }

    setResults(res);
    setSubmitted(true);

    const prev = progressMap.get(activeVerse.verseNumber);
    const attempts = (prev?.attempts || 0) + 1;
    let newLevel = prev?.masteryLevel || 0;

    if (allCorrect && !isMastered) {
      newLevel = Math.min(newLevel + 1, MAX_MASTERY);
    }

    const updated: VerseProgress = {
      book: bookName,
      chapter,
      verseNumber: activeVerse.verseNumber,
      masteryLevel: Math.max(newLevel, currentLevel),
      attempts,
      lastPracticed: new Date().toISOString(),
    };

    await ctxSaveProgress(updated);
  };

  const handleNext = () => {
    if (activeVerseIdx < verses.length - 1) {
      setActiveVerseIdx(activeVerseIdx + 1);
    }
  };

  const handleRetry = () => {
    setAnswers(new Map());
    setSubmitted(false);
    setResults(new Map());
  };

  const handleViewInBible = () => {
    if (!activeVerse) return;
    const tabNav = navigation.getParent();
    tabNav?.navigate('Bible', {
      screen: 'BibleMain',
      params: {
        verseRef: {
          book: bookName,
          chapter,
          verseNumber: activeVerse.verseNumber,
        },
      },
    });
  };

  const allCorrect = submitted && Array.from(results.values()).every(Boolean);

  useEffect(() => {
    if (
      submitted &&
      allCorrect &&
      activeVerseIdx < verses.length - 1 &&
      verses.length > 0
    ) {
      const t = setTimeout(() => {
        setActiveVerseIdx(activeVerseIdx + 1);
      }, 1000);
      return () => clearTimeout(t);
    }
  }, [submitted, allCorrect, activeVerseIdx, verses.length]);

  const styles = createStyles(theme);
  const topPad = insets.top + theme.safeArea.topPadding;

  const renderMasteryDots = (level: number) => {
    const dots = [];
    for (let i = 1; i <= MAX_MASTERY; i++) {
      dots.push(
        <View
          key={i}
          style={[
            styles.masteryDot,
            i <= level
              ? {backgroundColor: theme.colors.primary}
              : {backgroundColor: withOpacity(theme.colors.text, 0.15)},
          ]}
        />,
      );
    }
    return <View style={styles.masteryDots}>{dots}</View>;
  };

  // Build the verse display with blanks
  const renderVerseWithBlanks = () => {
    if (!activeVerse || words.length === 0) return null;

    return (
      <View style={styles.verseContainer}>
        <Text style={styles.verseReference}>{activeVerse.reference}</Text>
        <View style={styles.wordsWrap}>
          {words.map((word, idx) => {
            const isBlank = blankIndices.has(idx);
            if (!isBlank) {
              return (
                <Text key={idx} style={styles.wordText}>
                  {word}{' '}
                </Text>
              );
            }

            const currentBlankIdx = idx;
            const answer = answers.get(currentBlankIdx) || '';
            const result = results.get(currentBlankIdx);

            let inputStyle = styles.blankInput;
            if (submitted) {
              inputStyle =
                result === false
                  ? styles.blankInputWrong
                  : styles.blankInputCorrect;
            }

            const contentLen = Math.max(
              word.length,
              (answer || '').length,
              1,
            );
            const inputWidth = Math.max(60, contentLen * 16);

            return (
              <View key={idx} style={styles.blankWrapper}>
                {submitted && result === false ? (
                  <View
                    style={[
                      styles.blankInputWrong,
                      styles.blankInputWrongInline,
                      {
                        minWidth: Math.max(
                          60,
                          ((answer || '').length + 1 + word.length) * 16,
                        ),
                      },
                    ]}>
                    {answer ? (
                      <Text style={styles.blankStrikethrough}>{answer}</Text>
                    ) : null}
                    <Text style={styles.blankCorrect}>{word}</Text>
                  </View>
                ) : (
                  <TextInput
                    ref={ref => {
                      if (ref) inputRefs.current.set(currentBlankIdx, ref);
                    }}
                    style={[inputStyle, {width: inputWidth}]}
                    value={submitted && result !== false ? word : answer}
                    onChangeText={v => handleAnswerChange(currentBlankIdx, v)}
                    onKeyPress={e => handleKeyPress(currentBlankIdx, e)}
                    editable={!submitted}
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholder={'_'.repeat(Math.min(word.length, 8))}
                    placeholderTextColor={withOpacity(theme.colors.text, 0.25)}
                  />
                )}
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <TopographyBackground />
      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}>
        <ScrollView
          contentContainerStyle={{
            paddingTop: topPad,
            paddingBottom:
              insets.bottom +
              theme.safeArea.tabBarHeight +
              theme.safeArea.bottomPadding +
              80,
            paddingHorizontal: 0,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.paddedSection}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}>
              <Text style={styles.backText}>← {bookName}</Text>
            </TouchableOpacity>

            <Text style={styles.chapterTitle}>Chapter {chapter}</Text>
          </View>

          {/* Verse selector strip - full width, no horizontal padding */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.verseStrip}
            contentContainerStyle={styles.verseStripContent}>
            {verses.map((v, idx) => {
              const vp = progressMap.get(v.verseNumber);
              const ml = vp?.masteryLevel || 0;
              const isActive = idx === activeVerseIdx;
              return (
                <TouchableOpacity
                  key={v.verseNumber}
                  style={[
                    styles.versePill,
                    isActive && styles.versePillActive,
                    ml >= MAX_MASTERY && styles.versePillComplete,
                  ]}
                  onPress={() => setActiveVerseIdx(idx)}>
                  <Text
                    style={[
                      styles.versePillText,
                      isActive && styles.versePillTextActive,
                      ml >= MAX_MASTERY && styles.versePillTextComplete,
                    ]}>
                    {v.verseNumber}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Content with padding */}
          <View style={styles.paddedSection}>
          {/* Current mastery */}
          {activeVerse && (
            <View style={styles.masteryRow}>
              <Text style={styles.masteryLabel}>
                Mastery: Level {currentLevel}/{MAX_MASTERY}
              </Text>
              {renderMasteryDots(currentLevel)}
            </View>
          )}

          {activeVerse && isMastered && (
            <>
              <View style={styles.reviewLevelRow}>
                <Text style={styles.reviewLevelLabel}>Review at:</Text>
                {[1, 2, 3, 4].map(lvl => {
                  const isSelected = practiceLevel === lvl;
                  return (
                    <TouchableOpacity
                      key={lvl}
                      style={[
                        styles.reviewLevelPill,
                        isSelected && styles.reviewLevelPillSelected,
                      ]}
                      onPress={() => {
                        if (!submitted) {
                          setReviewLevel(lvl);
                          setAnswers(new Map());
                          setResults(new Map());
                          inputRefs.current.clear();
                        }
                      }}>
                      <Text
                        style={[
                          styles.reviewLevelPillText,
                          isSelected && styles.reviewLevelPillTextSelected,
                        ]}>
                        {lvl * 25}%
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          {/* Fill-in-the-blank area */}
          <View style={styles.practiceCard}>
            {renderVerseWithBlanks()}
          </View>

          {/* Need help link */}
          {activeVerse && (
            <TouchableOpacity
              style={styles.helpLink}
              onPress={handleViewInBible}>
              <Text style={styles.helpLinkText}>Need help? View in Bible</Text>
            </TouchableOpacity>
          )}

          {/* Action buttons */}
          {activeVerse && (
            <View style={styles.actions}>
              {!submitted ? (
                <TouchableOpacity
                  style={styles.actionButtonOutline}
                  onPress={handleSubmit}>
                  <Text style={styles.actionButtonOutlineText}>Check</Text>
                </TouchableOpacity>
              ) : allCorrect ? (
                <View style={styles.resultRow}>
                  <Text style={[styles.resultLabel, {color: theme.colors.success}]}>
                    {isMastered ? 'Still got it!' : 'Correct! Level up!'}
                  </Text>
                  {activeVerseIdx < verses.length - 1 && (
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        {backgroundColor: theme.colors.primary},
                      ]}
                      onPress={handleNext}>
                      <Text style={styles.actionButtonText}>Next Verse</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <View style={styles.resultRow}>
                  <Text style={[styles.resultLabel, {color: theme.colors.error}]}>
                    Some answers were incorrect
                  </Text>
                  <View style={styles.resultButtonsRow}>
                    <TouchableOpacity
                      style={styles.actionButtonOutline}
                      onPress={handleRetry}>
                      <Text style={styles.actionButtonOutlineText}>Retry</Text>
                    </TouchableOpacity>
                    {activeVerseIdx < verses.length - 1 && (
                      <TouchableOpacity
                        style={[
                          styles.actionButton,
                          {backgroundColor: theme.colors.primary},
                        ]}
                        onPress={handleNext}>
                        <Text style={styles.actionButtonText}>Continue</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}
            </View>
          )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    chapterTitle: {
      fontSize: 28,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    paddedSection: {
      paddingHorizontal: theme.spacing.lg,
    },
    verseStrip: {
      marginBottom: theme.spacing.md,
    },
    verseStripContent: {
      gap: 8,
      paddingVertical: theme.spacing.xs,
      paddingLeft: theme.spacing.lg,
      paddingRight: theme.spacing.lg,
    },
    versePill: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    versePillActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    versePillComplete: {
      borderColor: theme.colors.primary,
      backgroundColor: withOpacity(theme.colors.primary, 0.15),
    },
    versePillText: {
      fontSize: theme.typography.sizes.sm,
      fontWeight: theme.typography.weights.medium,
      color: theme.colors.text,
    },
    versePillTextActive: {
      color: '#FFFFFF',
    },
    versePillTextComplete: {
      color: theme.colors.primary,
    },
    masteryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.xs,
    },
    masteryLabel: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.textSecondary,
      marginRight: theme.spacing.sm,
    },
    masteryDots: {
      flexDirection: 'row',
      gap: 4,
    },
    masteryDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    levelHint: {
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.textTertiary,
      marginBottom: theme.spacing.md,
    },
    practiceCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing.xl,
      borderWidth: 0.5,
      borderColor: theme.colors.border,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: getShadowOpacity(theme.colors.background),
      shadowRadius: 12,
      elevation: 4,
      marginBottom: theme.spacing.lg,
    },
    verseContainer: {},
    verseReference: {
      fontSize: theme.typography.sizes.sm,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.primary,
      letterSpacing: theme.typography.letterSpacing.wide,
      textTransform: 'uppercase',
      marginBottom: theme.spacing.md,
    },
    wordsWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'flex-end',
    },
    wordText: {
      fontSize: theme.typography.sizes.xl,
      lineHeight: theme.typography.sizes.xl * 2,
      color: theme.colors.text,
      fontFamily: theme.typography.fonts.serif,
    },
    blankWrapper: {
      marginRight: 4,
      alignItems: 'center',
    },
    blankInput: {
      borderBottomWidth: 2,
      borderBottomColor: theme.colors.primary,
      fontSize: theme.typography.sizes.xl,
      fontFamily: theme.typography.fonts.serif,
      color: theme.colors.text,
      paddingVertical: 2,
      paddingHorizontal: 4,
      textAlign: 'center',
      minHeight: theme.typography.sizes.xl * 2,
    },
    blankInputCorrect: {
      borderBottomWidth: 2,
      borderBottomColor: theme.colors.success,
      backgroundColor: withOpacity(theme.colors.success, 0.1),
      fontSize: theme.typography.sizes.xl,
      fontFamily: theme.typography.fonts.serif,
      color: theme.colors.success,
      paddingVertical: 2,
      paddingHorizontal: 4,
      textAlign: 'center',
      minHeight: theme.typography.sizes.xl * 2,
    },
    blankInputWrong: {
      borderBottomWidth: 2,
      borderBottomColor: theme.colors.error,
      backgroundColor: withOpacity(theme.colors.error, 0.1),
      fontSize: theme.typography.sizes.xl,
      fontFamily: theme.typography.fonts.serif,
      color: theme.colors.error,
      paddingVertical: 2,
      paddingHorizontal: 4,
      textAlign: 'center',
      minHeight: theme.typography.sizes.xl * 2,
    },
    blankInputWrongInline: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      gap: 6,
    },
    blankStrikethrough: {
      fontSize: theme.typography.sizes.xl,
      fontFamily: theme.typography.fonts.serif,
      color: theme.colors.error,
      textDecorationLine: 'line-through',
    },
    blankCorrect: {
      fontSize: theme.typography.sizes.xl,
      fontFamily: theme.typography.fonts.serif,
      color: theme.colors.error,
    },
    helpLink: {
      alignSelf: 'center',
      marginBottom: theme.spacing.md,
    },
    helpLinkText: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.primary,
      fontWeight: theme.typography.weights.medium,
    },
    actions: {
      marginTop: theme.spacing.sm,
    },
    actionButton: {
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.xl,
      borderRadius: theme.borderRadius.lg,
      alignItems: 'center',
    },
    actionButtonText: {
      color: '#FFFFFF',
      fontSize: theme.typography.sizes.lg,
      fontWeight: theme.typography.weights.semibold,
    },
    actionButtonOutline: {
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.xl,
      borderRadius: theme.borderRadius.lg,
      alignItems: 'center',
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: theme.colors.primary,
    },
    actionButtonOutlineText: {
      color: theme.colors.primary,
      fontSize: theme.typography.sizes.lg,
      fontWeight: theme.typography.weights.semibold,
    },
    resultRow: {
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    resultButtonsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    resultLabel: {
      fontSize: theme.typography.sizes.body,
      fontWeight: theme.typography.weights.semibold,
      textAlign: 'center',
    },
    reviewLevelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: theme.spacing.md,
    },
    reviewLevelLabel: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.textSecondary,
      marginRight: 4,
    },
    reviewLevelPill: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    reviewLevelPillSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: withOpacity(theme.colors.primary, 0.12),
    },
    reviewLevelPillText: {
      fontSize: theme.typography.sizes.sm,
      fontWeight: theme.typography.weights.medium,
      color: theme.colors.textSecondary,
    },
    reviewLevelPillTextSelected: {
      color: theme.colors.primary,
    },
  });
