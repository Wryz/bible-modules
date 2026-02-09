import {NativeModules} from 'react-native';

interface WidgetDataManagerInterface {
  updateVerse(verse: string, reference: string): Promise<boolean>;
  updateWidgetSettings(
    frequency: string,
    customHours?: number,
  ): Promise<boolean>;
  updateThemeColors?(primaryColor: string | null): Promise<boolean>;
  updateThemeName?(themeName: string): Promise<boolean>;
}

const {WidgetDataManager} = NativeModules;

export default WidgetDataManager as WidgetDataManagerInterface;
