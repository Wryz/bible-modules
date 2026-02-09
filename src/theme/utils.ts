/**
 * Utility functions for theme operations
 */

/**
 * Determines if a color is dark by converting hex to RGB and calculating luminance
 */
export const isDarkColor = (hexColor: string): boolean => {
  // Remove # if present
  const hex = hexColor.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return true if luminance is less than 0.5 (dark)
  return luminance < 0.5;
};

/**
 * Gets appropriate shadow opacity based on background color
 */
export const getShadowOpacity = (backgroundColor: string): number => {
  return isDarkColor(backgroundColor) ? 0.3 : 0.1;
};

/**
 * Returns a color as rgba with the given opacity (0-1). Accepts hex (#RRGGBB).
 */
export const withOpacity = (hexColor: string, opacity: number): string => {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};
