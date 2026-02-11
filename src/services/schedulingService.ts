import {BibleVerse, ScheduledVerse} from '../types';
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
      const expandedVerse = BibleService.expandVerseWithContext(
        nextVerse.verse,
      );
      // Parallelize storage operations
      await Promise.all([
        StorageService.setCurrentVerse(expandedVerse),
        StorageService.addDisplayedVerse(expandedVerse),
        StorageService.removeScheduledVerse(nextVerse.id),
      ]);
      // Widget update can happen after storage operations complete (non-blocking)
      WidgetDataManager.updateVerse(
        expandedVerse.text,
        expandedVerse.reference,
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

    // Get recently displayed references to avoid repeating them
    const displayed = await StorageService.getDisplayedVerses();
    const excludeRefs = new Set(
      displayed.slice(0, 20).map(v => v.verse.reference),
    );

    let scheduled = 0;
    const maxAttempts = count * 10; // Prevent infinite loop
    let attempts = 0;

    while (scheduled < count && attempts < maxAttempts) {
      attempts++;
      const randomVerse = await this.getRandomVerseFromBible(excludeRefs);
      if (!randomVerse) break;

      const scheduledFor = new Date(now.getTime() + interval * (scheduled + 1));
      const scheduledVerse: ScheduledVerse = {
        id: `${Date.now()}-${scheduled}`,
        verse: randomVerse,
        scheduledFor,
      };
      await StorageService.addScheduledVerse(scheduledVerse);
      excludeRefs.add(randomVerse.reference);
      scheduled++;
    }
  }

  /**
   * Gets a random verse from the New Testament, excluding specified references.
   * Used by scheduleNextVerses to ensure unique verses per batch.
   */
  private static async getRandomVerseFromBible(
    excludeRefs: Set<string>,
  ): Promise<BibleVerse | null> {
    const books = BibleService.getNewTestamentBooks();
    if (books.length === 0) return null;

    for (let attempt = 0; attempt < 10; attempt++) {
      const randomBook = books[Math.floor(Math.random() * books.length)];
      const chapters = BibleService.getChapters(randomBook);
      if (chapters.length === 0) continue;

      const randomChapter =
        chapters[Math.floor(Math.random() * chapters.length)];
      const verses = BibleService.getVersesInChapter(randomBook, randomChapter);
      if (verses.length === 0) continue;

      const pickedVerse = verses[Math.floor(Math.random() * verses.length)];
      const randomVerse = BibleService.expandVerseWithContext(pickedVerse);

      if (excludeRefs.has(randomVerse.reference)) continue;

      return randomVerse;
    }
    return null;
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
      
      // Pick a random verse and expand with context if needed
      const pickedVerse = verses[Math.floor(Math.random() * verses.length)];
      const randomVerse = BibleService.expandVerseWithContext(pickedVerse);
      
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
        const pickedVerse = verses[Math.floor(Math.random() * verses.length)];
        const randomVerse = BibleService.expandVerseWithContext(pickedVerse);
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
