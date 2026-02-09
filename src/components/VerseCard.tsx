import React, {useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {BibleVerse} from '../types';
import {useTheme} from '../theme/useTheme';
import {getShadowOpacity} from '../theme/utils';
import {VerseActionSheet} from './VerseActionSheet';

interface VerseCardProps {
  verse: BibleVerse;
  onPress?: () => void;
}

export const VerseCard: React.FC<VerseCardProps> = ({verse, onPress}) => {
  const theme = useTheme();
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const styles = createStyles(theme);

  const handleLongPress = () => {
    setActionSheetVisible(true);
  };

  return (
    <>
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        onLongPress={handleLongPress}
        activeOpacity={0.7}>
        <Text style={styles.reference}>{verse.reference}</Text>
        <Text style={styles.text}>{verse.text}</Text>
      </TouchableOpacity>

      <VerseActionSheet
        visible={actionSheetVisible}
        verse={verse}
        onClose={() => setActionSheetVisible(false)}
      />
    </>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      marginVertical: theme.spacing.md,
      marginHorizontal: theme.spacing.md,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: getShadowOpacity(theme.colors.background),
      shadowRadius: 8,
      elevation: 4,
      borderWidth: 0.5,
      borderColor: theme.colors.border,
    },
    reference: {
      fontSize: theme.typography.sizes.sm,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.primary,
      marginBottom: theme.spacing.md,
      letterSpacing: theme.typography.letterSpacing.wide,
      textTransform: 'uppercase',
    },
    text: {
      fontSize: theme.typography.sizes.lg,
      lineHeight: theme.typography.sizes.lg * theme.typography.lineHeights.relaxed,
      color: theme.colors.text,
      fontFamily: theme.typography.fonts.serif,
      letterSpacing: theme.typography.letterSpacing.normal,
    },
  });
