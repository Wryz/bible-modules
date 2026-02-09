import React from 'react';
import Svg, {Path} from 'react-native-svg';
import {useTheme} from '../../theme/useTheme';

interface ArrowLeftIconProps {
  size?: number;
  color?: string;
}

export const ArrowLeftIcon: React.FC<ArrowLeftIconProps> = ({
  size = 24,
  color,
}) => {
  const theme = useTheme();
  const iconColor = color || '#FFFFFF';

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19L5 12L12 5"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};
