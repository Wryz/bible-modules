import React from 'react';
import Svg, {Path, Circle} from 'react-native-svg';
import {useTheme} from '../../theme/useTheme';

interface SettingsIconProps {
  size?: number;
  focused?: boolean;
}

export const SettingsIcon: React.FC<SettingsIconProps> = ({
  size = 24,
  focused = false,
}) => {
  const theme = useTheme();
  const color = focused ? theme.colors.tabBarActive : theme.colors.tabBarInactive;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle
        cx="12"
        cy="12"
        r="3"
        stroke={color}
        strokeWidth="2"
        fill={focused ? color : 'none'}
        fillOpacity={focused ? 0.2 : 0}
      />
      <Path
        d="M12 1V3M12 21V23M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M1 12H3M21 12H23M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
};
