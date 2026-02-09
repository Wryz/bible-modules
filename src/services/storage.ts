import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  VerseDisplay,
  Collection,
  ScheduledVerse,
  WidgetSettings,
  BibleVerse,
} from '../types';

const STORAGE_KEYS = {
  DISPLAYED_VERSES: '@bible:displayed_verses',
  SCHEDULED_VERSES: '@bible:scheduled_verses',
  COLLECTIONS: '@bible:collections',
  WIDGET_SETTINGS: '@bible:widget_settings',
  CURRENT_VERSE: '@bible:current_verse',
  CUSTOM_COLORS: '@bible:custom_colors',
};

export class StorageService {
  // Verse History
  static async getDisplayedVerses(): Promise<VerseDisplay[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.DISPLAYED_VERSES);
      if (!data) return [];
      const verses = JSON.parse(data);
      return verses.map((v: any) => ({
        ...v,
        displayedAt: new Date(v.displayedAt),
        scheduledFor: v.scheduledFor ? new Date(v.scheduledFor) : undefined,
      }));
    } catch (error) {
      console.error('Error getting displayed verses:', error);
      return [];
    }
  }

  static async addDisplayedVerse(verse: BibleVerse): Promise<void> {
    try {
      const displayed = await this.getDisplayedVerses();
      const newDisplay: VerseDisplay = {
        verse,
        displayedAt: new Date(),
      };
      displayed.unshift(newDisplay);
      // Keep only last 100 displayed verses
      const trimmed = displayed.slice(0, 100);
      await AsyncStorage.setItem(
        STORAGE_KEYS.DISPLAYED_VERSES,
        JSON.stringify(trimmed),
      );
    } catch (error) {
      console.error('Error adding displayed verse:', error);
    }
  }

  // Scheduled Verses
  static async getScheduledVerses(): Promise<ScheduledVerse[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SCHEDULED_VERSES);
      if (!data) return [];
      const verses = JSON.parse(data);
      return verses.map((v: any) => ({
        ...v,
        verse: v.verse,
        scheduledFor: new Date(v.scheduledFor),
      }));
    } catch (error) {
      console.error('Error getting scheduled verses:', error);
      return [];
    }
  }

  static async addScheduledVerse(verse: ScheduledVerse): Promise<void> {
    try {
      const scheduled = await this.getScheduledVerses();
      scheduled.push(verse);
      scheduled.sort(
        (a, b) =>
          a.scheduledFor.getTime() - b.scheduledFor.getTime(),
      );
      await AsyncStorage.setItem(
        STORAGE_KEYS.SCHEDULED_VERSES,
        JSON.stringify(scheduled),
      );
    } catch (error) {
      console.error('Error adding scheduled verse:', error);
    }
  }

  static async removeScheduledVerse(id: string): Promise<void> {
    try {
      const scheduled = await this.getScheduledVerses();
      const filtered = scheduled.filter(v => v.id !== id);
      await AsyncStorage.setItem(
        STORAGE_KEYS.SCHEDULED_VERSES,
        JSON.stringify(filtered),
      );
    } catch (error) {
      console.error('Error removing scheduled verse:', error);
    }
  }

  // Collections
  static async getCollections(): Promise<Collection[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.COLLECTIONS);
      if (!data) return [];
      const collections = JSON.parse(data);
      return collections.map((c: any) => ({
        ...c,
        createdAt: new Date(c.createdAt),
        updatedAt: new Date(c.updatedAt),
      }));
    } catch (error) {
      console.error('Error getting collections:', error);
      return [];
    }
  }

  static async saveCollection(collection: Collection): Promise<void> {
    try {
      const collections = await this.getCollections();
      const index = collections.findIndex(c => c.id === collection.id);
      if (index >= 0) {
        collections[index] = collection;
      } else {
        collections.push(collection);
      }
      await AsyncStorage.setItem(
        STORAGE_KEYS.COLLECTIONS,
        JSON.stringify(collections),
      );
    } catch (error) {
      console.error('Error saving collection:', error);
    }
  }

  static async deleteCollection(id: string): Promise<void> {
    try {
      const collections = await this.getCollections();
      const filtered = collections.filter(c => c.id !== id);
      await AsyncStorage.setItem(
        STORAGE_KEYS.COLLECTIONS,
        JSON.stringify(filtered),
      );
    } catch (error) {
      console.error('Error deleting collection:', error);
    }
  }

  // Widget Settings
  static async getWidgetSettings(): Promise<WidgetSettings> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.WIDGET_SETTINGS);
      if (!data) {
        return {refreshFrequency: 'daily'};
      }
      return JSON.parse(data);
    } catch (error) {
      console.error('Error getting widget settings:', error);
      return {refreshFrequency: 'daily'};
    }
  }

  static async saveWidgetSettings(settings: WidgetSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.WIDGET_SETTINGS,
        JSON.stringify(settings),
      );
      // Sync with widget via native module
      const WidgetDataManager = require('../native/WidgetDataManager').default;
      await WidgetDataManager.updateWidgetSettings(
        settings.refreshFrequency,
        settings.customHours,
      );
    } catch (error) {
      console.error('Error saving widget settings:', error);
    }
  }

  // Current Verse
  static async getCurrentVerse(): Promise<BibleVerse | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_VERSE);
      if (!data) return null;
      return JSON.parse(data);
    } catch (error) {
      console.error('Error getting current verse:', error);
      return null;
    }
  }

  static async setCurrentVerse(verse: BibleVerse): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.CURRENT_VERSE,
        JSON.stringify(verse),
      );
    } catch (error) {
      console.error('Error setting current verse:', error);
    }
  }

  // Custom Colors
  static async getCustomColors(): Promise<{primary?: string} | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.CUSTOM_COLORS);
      if (!data) return null;
      const parsed = JSON.parse(data);
      // Remove secondary if it exists (for backward compatibility)
      if (parsed.secondary) {
        delete parsed.secondary;
      }
      return parsed;
    } catch (error) {
      console.error('Error getting custom colors:', error);
      return null;
    }
  }

  static async saveCustomColors(colors: {primary?: string}): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.CUSTOM_COLORS,
        JSON.stringify(colors),
      );
      // Sync theme colors to widget
      const WidgetDataManager = require('../native/WidgetDataManager').default;
      if (WidgetDataManager.updateThemeColors) {
        await WidgetDataManager.updateThemeColors(
          colors.primary || null,
        );
      }
    } catch (error) {
      console.error('Error saving custom colors:', error);
    }
  }
}
