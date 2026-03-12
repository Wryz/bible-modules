import React from 'react';
import {TouchableOpacity, TouchableOpacityProps} from 'react-native';
import {triggerLightHaptic} from '../utils/haptics';

export const Button: React.FC<TouchableOpacityProps> = ({
  onPressIn,
  ...props
}) => {
  const handlePressIn = (e: any) => {
    triggerLightHaptic();
    onPressIn?.(e);
  };

  return <TouchableOpacity onPressIn={handlePressIn} {...props} />;
};
