import {ScheduledVerse} from '../types';
import {StorageService} from './storage';
import {BibleService} from './bibleService';
import WidgetDataManager from '../native/WidgetDataManager';

export class SchedulingService {
  static async getNextScheduledVerse(): Promise<ScheduledVerse | null> {
    const scheduled = await StorageService.getScheduledVerses();
    const now = new Date();
    const upcoming = scheduled.filter(v => v.scheduledFor > now);
    return upcoming.length > 0 ? upcoming[0] : null;
  }

  static async updateWidgetWithNextVerse(): Promise<void> {
    const nextVerse = await this.getNextScheduledVerse();
    if (nextVerse) {
      // Parallelize storage operations
      await Promise.all([
        StorageService.setCurrentVerse(nextVerse.verse),
        StorageService.addDisplayedVerse(nextVerse.verse),
        StorageService.removeScheduledVerse(nextVerse.id),
      ]);
      // Widget update can happen after storage operations complete (non-blocking)
      WidgetDataManager.updateVerse(
        nextVerse.verse.text,
        nextVerse.verse.reference,
      ).catch(error => {
        console.error('Error updating widget:', error);
      });
    }
  }

  static async scheduleVerseForWidget(
    verse: ScheduledVerse,
  ): Promise<void> {
    await StorageService.addScheduledVerse(verse);
  }

  static async getRefreshInterval(): Promise<number> {
    const settings = await StorageService.getWidgetSettings();
    switch (settings.refreshFrequency) {
      case 'hourly':
        return 60 * 60 * 1000; // 1 hour in milliseconds
      case 'daily':
        return 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      case 'custom':
        return (settings.customHours || 24) * 60 * 60 * 1000;
      case 'onAppOpen':
        // For onAppOpen, we don't use a scheduled interval
        // The verse will update when the app comes to foreground
        return 0;
      default:
        return 24 * 60 * 60 * 1000;
    }
  }

  static async updateVerseOnAppOpen(): Promise<void> {
    const settings = await StorageService.getWidgetSettings();
    if (settings.refreshFrequency === 'onAppOpen') {
      // Get a random verse instead of a scheduled one
      const randomVerse = await this.getRandomVerse();
      if (randomVerse) {
        // Parallelize storage operations
        await Promise.all([
          StorageService.setCurrentVerse(randomVerse.verse),
          StorageService.addDisplayedVerse(randomVerse.verse),
        ]);
        // Widget update can happen after storage operations complete
        WidgetDataManager.updateVerse(
          randomVerse.verse.text,
          randomVerse.verse.reference,
        ).catch(error => {
          console.error('Error updating widget:', error);
        });
      } else {
        // Fallback to scheduled verse if no displayed verses available
        await this.updateWidgetWithNextVerse();
      }
    } else {
      // For other refresh frequencies, ensure widget shows current verse
      // This ensures widget is always in sync when app opens
      const currentVerse = await StorageService.getCurrentVerse();
      if (currentVerse) {
        // Non-blocking widget update
        WidgetDataManager.updateVerse(
          currentVerse.text,
          currentVerse.reference,
        ).catch(error => {
          console.error('Error updating widget:', error);
        });
      } else {
        // If no current verse, get a random one and set it immediately
        // This prevents the widget from showing placeholder/skeleton loader
        const randomVerse = await this.getRandomVerse();
        if (randomVerse) {
          // Parallelize storage operations
          await Promise.all([
            StorageService.setCurrentVerse(randomVerse.verse),
            StorageService.addDisplayedVerse(randomVerse.verse),
          ]);
          // Widget update can happen after storage operations complete
          WidgetDataManager.updateVerse(
            randomVerse.verse.text,
            randomVerse.verse.reference,
          ).catch(error => {
            console.error('Error updating widget:', error);
          });
        } else {
          // Fallback to scheduled verse if available
          await this.updateWidgetWithNextVerse();
        }
      }
    }
  }

  static async scheduleNextVerses(count: number = 7): Promise<void> {
    const settings = await StorageService.getWidgetSettings();
    
    // For onAppOpen frequency, we don't need to schedule verses in advance
    // The verse will be selected when the app opens
    if (settings.refreshFrequency === 'onAppOpen') {
      return;
    }

    const interval = await this.getRefreshInterval();
    const now = new Date();

    // Get random verses to schedule (in production, use your collection or favorites)
    const displayed = await StorageService.getDisplayedVerses();
    const allVerses = displayed.map(v => v.verse);

    // For demo, we'll create some sample scheduled verses
    // In production, you'd select from user's collections or favorites
    for (let i = 0; i < count; i++) {
      const scheduledFor = new Date(now.getTime() + interval * (i + 1));
      // In production, select from actual verse pool
      if (allVerses.length > 0) {
        const randomVerse =
          allVerses[Math.floor(Math.random() * allVerses.length)];
        const scheduledVerse: ScheduledVerse = {
          id: Date.now().toString() + i,
          verse: randomVerse,
          scheduledFor,
        };
        await StorageService.addScheduledVerse(scheduledVerse);
      }
    }
  }

  static async getRandomVerse(): Promise<ScheduledVerse | null> {
    // Get the current verse to exclude it from selection
    const currentVerse = await StorageService.getCurrentVerse();
    
    // Get a random verse from New Testament only
    const books = BibleService.getNewTestamentBooks();
    if (books.length === 0) {
      return null;
    }
    
    // Optimize: Pre-calculate book/chapter counts to reduce repeated lookups
    // Try up to 5 times (reduced from 10) to find a verse that's different from the current one
    for (let attempt = 0; attempt < 5; attempt++) {
      // Pick a random book from New Testament
      const randomBook = books[Math.floor(Math.random() * books.length)];
      const chapters = BibleService.getChapters(randomBook);
      if (chapters.length === 0) {
        continue;
      }
      
      // Pick a random chapter
      const randomChapter = chapters[Math.floor(Math.random() * chapters.length)];
      const verses = BibleService.getVersesInChapter(randomBook, randomChapter);
      if (verses.length === 0) {
        continue;
      }
      
      // Pick a random verse
      const randomVerse = verses[Math.floor(Math.random() * verses.length)];
      
      // If we have a current verse, make sure the new one is different
      if (currentVerse && 
          randomVerse.reference === currentVerse.reference &&
          randomVerse.text === currentVerse.text) {
        // This is the same verse, try again
        continue;
      }
      
      return {
        id: Date.now().toString(),
        verse: randomVerse,
        scheduledFor: new Date(),
      };
    }
    
    // If we couldn't find a different verse after 5 attempts, 
    // just return any random verse from New Testament (should be very rare)
    const randomBook = books[Math.floor(Math.random() * books.length)];
    const chapters = BibleService.getChapters(randomBook);
    if (chapters.length > 0) {
      const randomChapter = chapters[Math.floor(Math.random() * chapters.length)];
      const verses = BibleService.getVersesInChapter(randomBook, randomChapter);
      if (verses.length > 0) {
        const randomVerse = verses[Math.floor(Math.random() * verses.length)];
        return {
          id: Date.now().toString(),
          verse: randomVerse,
          scheduledFor: new Date(),
        };
      }
    }
    
    return null;
  }
}
