import {BibleBook, BibleVerse, BibleVerseData} from '../types';
import nivBibleData from '../data/bible-niv.json';

interface NIVBibleData {
  version: string;
  books: BibleBook[];
}

export class BibleService {
  private static bibleData: BibleBook[] = (nivBibleData as NIVBibleData).books;

  static async loadBibleData(): Promise<void> {
    // Bible data is already loaded from JSON file
    // This method is kept for future async loading if needed
  }

  static getVerse(
    bookName: string,
    chapter: number,
    verseNumber: number,
  ): BibleVerse | null {
    const book = this.bibleData.find(
      b => b.name.toLowerCase() === bookName.toLowerCase() ||
           b.abbreviation.toLowerCase() === bookName.toLowerCase(),
    );
    if (!book) return null;

    const chapterData = book.chapters.find(c => c.chapterNumber === chapter);
    if (!chapterData) return null;

    const verseData = chapterData.verses.find(
      v => v.verseNumber === verseNumber,
    );
    if (!verseData) return null;

    return {
      verse: verseData.text,
      reference: `${book.name} ${chapter}:${verseNumber}`,
      book: book.name,
      chapter,
      verseNumber,
      text: verseData.text,
    };
  }

  static searchVerses(query: string): BibleVerse[] {
    const results: BibleVerse[] = [];
    const lowerQuery = query.toLowerCase();

    for (const book of this.bibleData) {
      for (const chapter of book.chapters) {
        for (const verseData of chapter.verses) {
          if (
            verseData.text.toLowerCase().includes(lowerQuery) ||
            book.name.toLowerCase().includes(lowerQuery)
          ) {
            results.push({
              verse: verseData.text,
              reference: `${book.name} ${chapter.chapterNumber}:${verseData.verseNumber}`,
              book: book.name,
              chapter: chapter.chapterNumber,
              verseNumber: verseData.verseNumber,
              text: verseData.text,
            });
          }
        }
      }
    }

    return results;
  }

  static searchVersesInBook(bookName: string, query: string): BibleVerse[] {
    const results: BibleVerse[] = [];
    const lowerQuery = query.toLowerCase();

    const book = this.bibleData.find(
      b => b.name.toLowerCase() === bookName.toLowerCase() ||
           b.abbreviation.toLowerCase() === bookName.toLowerCase(),
    );

    if (!book) return [];

    for (const chapter of book.chapters) {
      for (const verseData of chapter.verses) {
        if (verseData.text.toLowerCase().includes(lowerQuery)) {
          results.push({
            verse: verseData.text,
            reference: `${book.name} ${chapter.chapterNumber}:${verseData.verseNumber}`,
            book: book.name,
            chapter: chapter.chapterNumber,
            verseNumber: verseData.verseNumber,
            text: verseData.text,
          });
        }
      }
    }

    return results;
  }

  static getAllBooks(): string[] {
    return this.bibleData.map(book => book.name);
  }

  static getChapters(bookName: string): number[] {
    const book = this.bibleData.find(
      b => b.name.toLowerCase() === bookName.toLowerCase() ||
           b.abbreviation.toLowerCase() === bookName.toLowerCase(),
    );
    if (!book) return [];
    return book.chapters.map(c => c.chapterNumber);
  }

  static getVersesInChapter(
    bookName: string,
    chapter: number,
  ): BibleVerse[] {
    const book = this.bibleData.find(
      b => b.name.toLowerCase() === bookName.toLowerCase() ||
           b.abbreviation.toLowerCase() === bookName.toLowerCase(),
    );
    if (!book) return [];

    const chapterData = book.chapters.find(c => c.chapterNumber === chapter);
    if (!chapterData) return [];

    return chapterData.verses.map(verseData => ({
      verse: verseData.text,
      reference: `${book.name} ${chapter}:${verseData.verseNumber}`,
      book: book.name,
      chapter,
      verseNumber: verseData.verseNumber,
      text: verseData.text,
    }));
  }

  // Parse reference like "John 3:16", "Genesis 1:1", "1 Samuel 2:3"
  static parseReference(reference: string): BibleVerse | null {
    // Match book name (may include numbers like "1 Samuel"), chapter, and verse
    // Pattern: (optional number + word(s)) + space + number + : + number
    const match = reference.match(/^(\d+\s+)?([A-Za-z]+(?:\s+[A-Za-z]+)*)\s+(\d+):(\d+)/i);
    if (!match) return null;

    const [, numberPrefix, bookName, chapterStr, verseStr] = match;
    const fullBookName = numberPrefix ? `${numberPrefix.trim()} ${bookName}` : bookName;
    const chapter = parseInt(chapterStr, 10);
    const verseNumber = parseInt(verseStr, 10);

    return this.getVerse(fullBookName, chapter, verseNumber);
  }
}
