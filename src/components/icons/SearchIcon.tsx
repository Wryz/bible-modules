import React from 'react';
import Svg, {Path} from 'react-native-svg';
import {useTheme} from '../../theme/useTheme';

interface SearchIconProps {
  size?: number;
  color?: string;
}

export const SearchIcon: React.FC<SearchIconProps> = ({
  size = 24,
  color,
}) => {
  const theme = useTheme();
  const iconColor = color || theme.colors.text;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};
