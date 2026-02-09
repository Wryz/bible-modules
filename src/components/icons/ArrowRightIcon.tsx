import React from 'react';
import Svg, {Path} from 'react-native-svg';
import {useTheme} from '../../theme/useTheme';

interface ArrowRightIconProps {
  size?: number;
  color?: string;
}

export const ArrowRightIcon: React.FC<ArrowRightIconProps> = ({
  size = 24,
  color,
}) => {
  const theme = useTheme();
  const iconColor = color || '#FFFFFF';

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12H19M12 5L19 12L12 19"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};
