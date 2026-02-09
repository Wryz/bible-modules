import React from 'react';
import Svg, {Path} from 'react-native-svg';
import {useTheme} from '../../theme/useTheme';

interface ChevronDownIconProps {
  size?: number;
  color?: string;
}

export const ChevronDownIcon: React.FC<ChevronDownIconProps> = ({
  size = 24,
  color,
}) => {
  const theme = useTheme();
  const iconColor = color || theme.colors.textSecondary;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 9L12 15L18 9"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};
