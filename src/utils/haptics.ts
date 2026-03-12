import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

export function triggerLightHaptic(): void {
  try {
    ReactNativeHapticFeedback.trigger('impactLight', {
      enableVibrateFallback: false,
      ignoreAndroidSystemSettings: false,
    });
  } catch {
    // Silently ignore if haptics unavailable (e.g. simulator)
  }
}
