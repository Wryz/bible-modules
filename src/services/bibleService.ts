import {BibleBook, BibleVerse} from '../types';
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

  static getNewTestamentBooks(): string[] {
    // New Testament starts with Matthew
    const newTestamentStart = 'Matthew';
    const allBooks = this.getAllBooks();
    const matthewIndex = allBooks.findIndex(book => book === newTestamentStart);
    
    if (matthewIndex === -1) {
      // If Matthew not found, return all books (fallback)
      return allBooks;
    }
    
    // Return all books from Matthew onwards
    return allBooks.slice(matthewIndex);
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

  /**
   * Get the verse immediately before the given verse (previous verse number,
   * or last verse of previous chapter if at verse 1, or null at start of Bible).
   */
  static getPreviousVerse(verse: BibleVerse): BibleVerse | null {
    if (verse.verseNumber > 1) {
      return this.getVerse(verse.book, verse.chapter, verse.verseNumber - 1);
    }
    // At verse 1 - need last verse of previous chapter
    const book = this.bibleData.find(
      b => b.name.toLowerCase() === verse.book.toLowerCase() ||
           b.abbreviation.toLowerCase() === verse.book.toLowerCase(),
    );
    if (!book) return null;

    const chapterIndex = book.chapters.findIndex(
      c => c.chapterNumber === verse.chapter,
    );
    if (chapterIndex <= 0) {
      // First chapter of book - need last verse of previous book's last chapter
      const bookIndex = this.bibleData.findIndex(
        b => b.name.toLowerCase() === verse.book.toLowerCase() ||
             b.abbreviation.toLowerCase() === verse.book.toLowerCase(),
      );
      if (bookIndex <= 0) return null;
      const prevBook = this.bibleData[bookIndex - 1];
      const prevChapters = prevBook.chapters;
      const lastChapter = prevChapters[prevChapters.length - 1];
      const lastVerse = lastChapter.verses[lastChapter.verses.length - 1];
      return {
        verse: lastVerse.text,
        reference: `${prevBook.name} ${lastChapter.chapterNumber}:${lastVerse.verseNumber}`,
        book: prevBook.name,
        chapter: lastChapter.chapterNumber,
        verseNumber: lastVerse.verseNumber,
        text: lastVerse.text,
      };
    }
    const prevChapter = book.chapters[chapterIndex - 1];
    const lastVerse = prevChapter.verses[prevChapter.verses.length - 1];
    return {
      verse: lastVerse.text,
      reference: `${book.name} ${prevChapter.chapterNumber}:${lastVerse.verseNumber}`,
      book: book.name,
      chapter: prevChapter.chapterNumber,
      verseNumber: lastVerse.verseNumber,
      text: lastVerse.text,
    };
  }

  /**
   * Get the verse immediately after the given verse (next verse number,
   * or first verse of next chapter if at last verse, or null at end of Bible).
   */
  static getNextVerse(verse: BibleVerse): BibleVerse | null {
    const book = this.bibleData.find(
      b => b.name.toLowerCase() === verse.book.toLowerCase() ||
           b.abbreviation.toLowerCase() === verse.book.toLowerCase(),
    );
    if (!book) return null;

    const chapterData = book.chapters.find(
      c => c.chapterNumber === verse.chapter,
    );
    if (!chapterData) return null;

    const nextInChapter = this.getVerse(
      verse.book,
      verse.chapter,
      verse.verseNumber + 1,
    );
    if (nextInChapter) return nextInChapter;
    // At last verse of chapter - need first verse of next chapter
    const chapterIndex = book.chapters.findIndex(
      c => c.chapterNumber === verse.chapter,
    );
    if (chapterIndex < book.chapters.length - 1) {
      const nextChapter = book.chapters[chapterIndex + 1];
      const firstVerse = nextChapter.verses[0];
      return {
        verse: firstVerse.text,
        reference: `${book.name} ${nextChapter.chapterNumber}:${firstVerse.verseNumber}`,
        book: book.name,
        chapter: nextChapter.chapterNumber,
        verseNumber: firstVerse.verseNumber,
        text: firstVerse.text,
      };
    }
    // At last chapter of book - need first verse of next book
    const bookIndex = this.bibleData.findIndex(
      b => b.name.toLowerCase() === verse.book.toLowerCase() ||
           b.abbreviation.toLowerCase() === verse.book.toLowerCase(),
    );
    if (bookIndex >= this.bibleData.length - 1) return null;
    const nextBook = this.bibleData[bookIndex + 1];
    const firstChapter = nextBook.chapters[0];
    const firstVerse = firstChapter.verses[0];
    return {
      verse: firstVerse.text,
      reference: `${nextBook.name} ${firstChapter.chapterNumber}:${firstVerse.verseNumber}`,
      book: nextBook.name,
      chapter: firstChapter.chapterNumber,
      verseNumber: firstVerse.verseNumber,
      text: firstVerse.text,
    };
  }

  /**
   * Expands a verse with context when needed. If the verse doesn't start with a
   * capitalized letter, adds previous verse(s). If it doesn't end with proper
   * punctuation (. ! ? "), adds next verse(s). Repeats until both conditions
   * are satisfied. Returns a BibleVerse with combined text and reference
   * (e.g. "John 3:14-16").
   */
  static expandVerseWithContext(verse: BibleVerse): BibleVerse {
    const PROPER_ENDINGS = /[.!?"]$/;

    let verses: BibleVerse[] = [verse];

    // Iterate until both start and end are complete (no more verses to add)
    let changed = true;
    while (changed) {
      changed = false;
      const firstVerse = verses[0];
      const lastVerse = verses[verses.length - 1];

      // Add previous verses until we start with a capital letter
      const firstChar = firstVerse.text.trim().charAt(0);
      if (!/[A-Z]/.test(firstChar)) {
        const prev = this.getPreviousVerse(firstVerse);
        if (prev) {
          verses = [prev, ...verses];
          changed = true;
        }
      }

      // Add next verses until we end with proper punctuation
      const trimmed = lastVerse.text.trim();
      if (!PROPER_ENDINGS.test(trimmed)) {
        const next = this.getNextVerse(lastVerse);
        if (next) {
          verses = [...verses, next];
          changed = true;
        }
      }
    }

    if (verses.length === 1) return verse;

    const combinedText = verses.map(v => v.text.trim()).join(' ');
    const first = verses[0];
    const last = verses[verses.length - 1];
    let reference: string;
    if (first.reference === last.reference) {
      reference = first.reference;
    } else if (first.book === last.book && first.chapter === last.chapter) {
      reference = `${first.book} ${first.chapter}:${first.verseNumber}-${last.verseNumber}`;
    } else if (first.book === last.book) {
      reference = `${first.reference}-${last.chapter}:${last.verseNumber}`;
    } else {
      reference = `${first.reference}-${last.reference}`;
    }

    return {
      verse: combinedText,
      reference,
      book: first.book,
      chapter: first.chapter,
      verseNumber: first.verseNumber,
      text: combinedText,
    };
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
