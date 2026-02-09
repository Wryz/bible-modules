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
