export interface BibleVerse {
  verse: string;
  reference: string;
  book: string;
  chapter: number;
  verseNumber: number;
  text: string;
}

export interface BibleBook {
  name: string;
  abbreviation: string;
  chapters: BibleChapter[];
}

export interface BibleChapter {
  chapterNumber: number;
  verses: BibleVerseData[];
}

export interface BibleVerseData {
  verseNumber: number;
  text: string;
}

export interface VerseDisplay {
  verse: BibleVerse;
  displayedAt: Date;
  scheduledFor?: Date;
}

export interface Collection {
  id: string;
  name: string;
  verses: BibleVerse[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ScheduledVerse {
  id: string;
  verse: BibleVerse;
  scheduledFor: Date;
  collectionId?: string;
}

export interface WidgetSettings {
  refreshFrequency: 'hourly' | 'daily' | 'custom' | 'onAppOpen';
  customHours?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  verses?: BibleVerse[];
  timestamp: Date;
}

export interface VerseProgress {
  book: string;
  chapter: number;
  verseNumber: number;
  masteryLevel: number; // 0-4 (0=not started, 1-4=increasing blank %)
  attempts: number;
  lastPracticed?: string; // ISO date string
}

export interface BookProgress {
  bookName: string;
  totalVerses: number;
  completedVerses: number; // verses at mastery level 4
  startedVerses: number; // verses at mastery level >= 1
  totalChapters: number;
  completedChapters: number; // chapters where all verses are at level 4
}

export interface ChapterProgress {
  chapter: number;
  totalVerses: number;
  completedVerses: number;
  startedVerses: number;
}
