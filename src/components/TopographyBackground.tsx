import React from 'react';
import {View, StyleSheet, Dimensions} from 'react-native';
import TopographySvg from '../theme/backgrounds/topography.svg';
import {useTheme} from '../theme/useTheme';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

export const TopographyBackground: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.themeName === 'dark';
  const fill = isDark ? '#FFFFFF' : '#000000';

  return (
    <View style={styles.container} pointerEvents="none">
      <TopographySvg
        width={SCREEN_WIDTH}
        height={SCREEN_HEIGHT}
        viewBox="0 0 600 600"
        preserveAspectRatio="xMidYMid slice"
        fill={fill}
        style={[styles.svg, {
          filter: `brightness(${isDark ? 0.8 : 0})`,
          opacity: isDark ? 0.3 : 0.18,
        }]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  svg: {
    opacity: 0.18,
  },
});
