import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {ChapterProgress} from '../types';
import {useTheme} from '../theme/useTheme';
import {getShadowOpacity, withOpacity} from '../theme/utils';
import {TopographyBackground} from '../components/TopographyBackground';
import {useProgress} from '../context/ProgressContext';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const TILE_GAP = 10;
const TILES_PER_ROW = 5;

type HomeStackParamList = {
  HomeMain: undefined;
  ChapterList: {bookName: string};
  VersePractice: {bookName: string; chapter: number};
};

export const ChapterListScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const navigation = useNavigation<StackNavigationProp<HomeStackParamList>>();
  const route = useRoute<RouteProp<HomeStackParamList, 'ChapterList'>>();
  const {bookName} = route.params;
  const {getChapterProgressList} = useProgress();

  const chapterProgress = getChapterProgressList(bookName);

  let totalCompleted = 0;
  let totalVerses = 0;
  for (const cp of chapterProgress) {
    totalVerses += cp.totalVerses;
    totalCompleted += cp.completedVerses;
  }

  const styles = createStyles(theme);
  const topPad = insets.top + theme.safeArea.topPadding;
  const horizontalPad = theme.spacing.lg;
  const availableWidth = SCREEN_WIDTH - horizontalPad * 2;
  const tileSize = (availableWidth - TILE_GAP * (TILES_PER_ROW - 1)) / TILES_PER_ROW;

  const overallPct = totalVerses > 0 ? totalCompleted / totalVerses : 0;

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
          paddingHorizontal: horizontalPad,
        }}
        showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.bookTitle}>{bookName}</Text>
        <View style={styles.statsRow}>
          <Text style={styles.statsText}>
            {chapterProgress.length} chapter{chapterProgress.length !== 1 ? 's' : ''}
            {'  ·  '}
            {totalVerses} verse{totalVerses !== 1 ? 's' : ''}
          </Text>
          {overallPct > 0 && (
            <Text style={styles.statsPct}>{Math.round(overallPct * 100)}% mastered</Text>
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
                    overallPct >= 1 ? theme.colors.success : theme.colors.primary,
                },
              ]}
            />
          </View>
        )}

        <View style={styles.grid}>
          {chapterProgress.map(cp => {
            const tileExtra = getTileStyle(cp);
            const isComplete =
              cp.totalVerses > 0 && cp.completedVerses >= cp.totalVerses;
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
                    bookName,
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
                {isComplete && <Text style={styles.tileCheck}>✓</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
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
    bookTitle: {
      fontSize: 28,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
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
