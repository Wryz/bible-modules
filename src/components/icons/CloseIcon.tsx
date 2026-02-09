import React from 'react';
import Svg, {Path} from 'react-native-svg';
import {useTheme} from '../../theme/useTheme';

interface CloseIconProps {
  size?: number;
  color?: string;
}

export const CloseIcon: React.FC<CloseIconProps> = ({
  size = 24,
  color,
}) => {
  const theme = useTheme();
  const iconColor = color || theme.colors.textTertiary;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 6L6 18M6 6L18 18"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};
