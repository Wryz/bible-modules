import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import {BibleService} from '../services/bibleService';
import {StorageService} from '../services/storage';
import {VerseProgress, ChapterProgress, BookProgress} from '../types';

interface ProgressContextType {
  verseProgress: VerseProgress[];
  focusedBook: string;
  isLoading: boolean;

  setFocusedBook: (book: string) => Promise<void>;
  saveVerseProgress: (progress: VerseProgress) => Promise<void>;

  getVerseProgressForChapter: (
    book: string,
    chapter: number,
  ) => VerseProgress[];
  getChapterProgressList: (bookName: string) => ChapterProgress[];
  getBookProgress: (bookName: string) => BookProgress;
  getAllBooksProgress: () => Map<string, {completed: number; total: number}>;
}

const ProgressContext = createContext<ProgressContextType | undefined>(
  undefined,
);

export const ProgressProvider: React.FC<{children: ReactNode}> = ({
  children,
}) => {
  const [verseProgress, setVerseProgress] = useState<VerseProgress[]>([]);
  const [focusedBook, setFocusedBookState] = useState<string>('Genesis');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [allProgress, savedBook] = await Promise.all([
        StorageService.getAllProgress(),
        StorageService.getFocusedBook(),
      ]);
      setVerseProgress(allProgress);

      if (savedBook) {
        setFocusedBookState(savedBook);
      } else {
        const booksWithProgress = new Set(allProgress.map(p => p.book));
        const allBooks = BibleService.getAllBooks();
        const first = allBooks.find(b => booksWithProgress.has(b));
        setFocusedBookState(first || 'Genesis');
      }

      setIsLoading(false);
    };
    load();
  }, []);

  const setFocusedBook = useCallback(async (book: string) => {
    setFocusedBookState(book);
    await StorageService.setFocusedBook(book);
  }, []);

  const saveVerseProgress = useCallback(async (progress: VerseProgress) => {
    setVerseProgress(prev => {
      const idx = prev.findIndex(
        p =>
          p.book === progress.book &&
          p.chapter === progress.chapter &&
          p.verseNumber === progress.verseNumber,
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = progress;
        return next;
      }
      return [...prev, progress];
    });
    await StorageService.saveVerseProgress(progress);
  }, []);

  const getVerseProgressForChapter = useCallback(
    (book: string, chapter: number) => {
      return verseProgress.filter(
        p => p.book === book && p.chapter === chapter,
      );
    },
    [verseProgress],
  );

  const getChapterProgressList = useCallback(
    (bookName: string): ChapterProgress[] => {
      const chapters = BibleService.getChapters(bookName);
      const versesMap = BibleService.getVersesPerChapterMap(bookName);
      const bookProg = verseProgress.filter(p => p.book === bookName);

      return chapters.map(ch => {
        const chapterVerses = bookProg.filter(p => p.chapter === ch);
        const totalVerses = versesMap.get(ch) || 0;
        return {
          chapter: ch,
          totalVerses,
          completedVerses: chapterVerses.filter(p => p.masteryLevel >= 4)
            .length,
          startedVerses: chapterVerses.filter(p => p.masteryLevel >= 1).length,
        };
      });
    },
    [verseProgress],
  );

  const getBookProgress = useCallback(
    (bookName: string): BookProgress => {
      const chapters = BibleService.getChapters(bookName);
      const versesMap = BibleService.getVersesPerChapterMap(bookName);
      const bookProg = verseProgress.filter(p => p.book === bookName);

      let totalVerses = 0;
      for (const count of versesMap.values()) {
        totalVerses += count;
      }

      const completedVerses = bookProg.filter(
        p => p.masteryLevel >= 4,
      ).length;
      const startedVerses = bookProg.filter(p => p.masteryLevel >= 1).length;

      let completedChapters = 0;
      for (const ch of chapters) {
        const chapterVerseCount = versesMap.get(ch) || 0;
        const chapterCompleted = bookProg.filter(
          p => p.chapter === ch && p.masteryLevel >= 4,
        ).length;
        if (
          chapterVerseCount > 0 &&
          chapterCompleted >= chapterVerseCount
        ) {
          completedChapters++;
        }
      }

      return {
        bookName,
        totalVerses,
        completedVerses,
        startedVerses,
        totalChapters: chapters.length,
        completedChapters,
      };
    },
    [verseProgress],
  );

  const getAllBooksProgress = useMemo(() => {
    const allBooks = BibleService.getAllBooks();
    const map = new Map<string, {completed: number; total: number}>();
    for (const bookName of allBooks) {
      const versesMap = BibleService.getVersesPerChapterMap(bookName);
      const bookProg = verseProgress.filter(p => p.book === bookName);
      let total = 0;
      for (const count of versesMap.values()) {
        total += count;
      }
      const completed = bookProg.filter(p => p.masteryLevel >= 4).length;
      map.set(bookName, {completed, total});
    }
    return map;
  }, [verseProgress]);

  const getAllBooksProgressFn = useCallback(
    () => getAllBooksProgress,
    [getAllBooksProgress],
  );

  const value = useMemo(
    () => ({
      verseProgress,
      focusedBook,
      isLoading,
      setFocusedBook,
      saveVerseProgress,
      getVerseProgressForChapter,
      getChapterProgressList,
      getBookProgress,
      getAllBooksProgress: getAllBooksProgressFn,
    }),
    [
      verseProgress,
      focusedBook,
      isLoading,
      setFocusedBook,
      saveVerseProgress,
      getVerseProgressForChapter,
      getChapterProgressList,
      getBookProgress,
      getAllBooksProgressFn,
    ],
  );

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
};

export const useProgress = (): ProgressContextType => {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
};
