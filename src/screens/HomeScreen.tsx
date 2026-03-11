import React from 'react';
import {View, StyleSheet, ScrollView} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '../theme/useTheme';
import {TopographyBackground} from '../components/TopographyBackground';
import {FocusBookHeader} from '../components/FocusBookHeader';

export const HomeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

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
        }}
        showsVerticalScrollIndicator={false}>
        <FocusBookHeader />
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
  });
