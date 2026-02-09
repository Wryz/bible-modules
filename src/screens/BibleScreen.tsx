import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {VerseCard} from '../components/VerseCard';
import {BibleService} from '../services/bibleService';
import {BibleVerse} from '../types';
import {useTheme} from '../theme/useTheme';
import {ChapterReader} from '../components/ChapterReader';
import {ChapterDrawer} from '../components/ChapterDrawer';
import {SearchIcon} from '../components/icons/SearchIcon';
import {CloseIcon} from '../components/icons/CloseIcon';
import {TopographyBackground} from '../components/TopographyBackground';

export const BibleScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const [selectedBook, setSelectedBook] = useState<string>('Genesis');
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<BibleVerse[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadChapter(selectedBook, selectedChapter);
  }, [selectedBook, selectedChapter]);

  // Cleanup search timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const loadChapter = (book: string, chapter: number) => {
    const chapterVerses = BibleService.getVersesInChapter(book, chapter);
    setVerses(chapterVerses);
  };

  const handleBookSelect = (book: string) => {
    setSelectedBook(book);
    setSelectedChapter(1); // Go to first chapter of selected book
  };

  const handlePrevChapter = () => {
    const chapters = BibleService.getChapters(selectedBook);
    const currentIndex = chapters.indexOf(selectedChapter);
    if (currentIndex > 0) {
      setSelectedChapter(chapters[currentIndex - 1]);
    } else if (currentIndex === 0) {
      // Go to previous book's last chapter
      const books = BibleService.getAllBooks();
      const bookIndex = books.indexOf(selectedBook);
      if (bookIndex > 0) {
        const prevBook = books[bookIndex - 1];
        const prevBookChapters = BibleService.getChapters(prevBook);
        if (prevBookChapters.length > 0) {
          setSelectedBook(prevBook);
          setSelectedChapter(
            prevBookChapters[prevBookChapters.length - 1],
          );
        }
      }
    }
  };

  const handleNextChapter = () => {
    const chapters = BibleService.getChapters(selectedBook);
    const currentIndex = chapters.indexOf(selectedChapter);
    if (currentIndex < chapters.length - 1) {
      setSelectedChapter(chapters[currentIndex + 1]);
    } else if (currentIndex === chapters.length - 1) {
      // Go to next book's first chapter
      const books = BibleService.getAllBooks();
      const bookIndex = books.indexOf(selectedBook);
      if (bookIndex < books.length - 1) {
        const nextBook = books[bookIndex + 1];
        const nextBookChapters = BibleService.getChapters(nextBook);
        if (nextBookChapters.length > 0) {
          setSelectedBook(nextBook);
          setSelectedChapter(nextBookChapters[0]);
        }
      }
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Check if it's a reference format
      const verse = BibleService.parseReference(query);
      if (verse) {
        setSearchResults([verse]);
        // Navigate to the verse's chapter
        setSelectedBook(verse.book);
        setSelectedChapter(verse.chapter);
        setSearchVisible(false);
      } else {
        // Search by text within the current book
        const results = BibleService.searchVersesInBook(selectedBook, query);
        setSearchResults(results);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchResultSelect = (verse: BibleVerse) => {
    setSelectedBook(verse.book);
    setSelectedChapter(verse.chapter);
    setSearchVisible(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const styles = createStyles(theme, insets);
  const chapters = BibleService.getChapters(selectedBook);
  const currentChapterIndex = chapters.indexOf(selectedChapter);
  const canGoPrev = currentChapterIndex > 0 || selectedBook !== 'Genesis';
  const canGoNext =
    currentChapterIndex < chapters.length - 1 ||
    selectedBook !== BibleService.getAllBooks()[BibleService.getAllBooks().length - 1];

  return (
    <View style={styles.container}>
      <TopographyBackground />
      {/* Tap area to open drawer when closed - wider area for better UX */}
      {!drawerVisible && (
        <TouchableOpacity
          style={styles.drawerOpenArea}
          onPress={() => setDrawerVisible(true)}
          activeOpacity={1}
        />
      )}

      {/* Search Toggle Button - Floating */}
      {!searchVisible && (
        <TouchableOpacity
          style={styles.searchToggleButton}
          onPress={() => setSearchVisible(true)}>
          <SearchIcon size={20} />
        </TouchableOpacity>
      )}

      {/* Collapsible Search Bar */}
      {searchVisible && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search verses or enter reference (e.g., John 3:16)"
            placeholderTextColor={theme.colors.textTertiary}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              // Clear previous timeout
              if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
              }
              // Trigger search as user types (debounced by 300ms)
              if (text.trim()) {
                setIsSearching(true);
                searchTimeoutRef.current = setTimeout(() => {
                  handleSearch(text);
                }, 300);
              } else {
                setSearchResults([]);
                setIsSearching(false);
              }
            }}
            onSubmitEditing={() => handleSearch(searchQuery)}
            returnKeyType="search"
            autoFocus={true}
          />
          <TouchableOpacity
            style={styles.closeSearchButton}
            onPress={() => {
              setSearchVisible(false);
              setSearchQuery('');
              setSearchResults([]);
            }}>
            <CloseIcon size={20} />
          </TouchableOpacity>
        </View>
      )}

      {/* Search Results or Chapter Reader */}
      {searchVisible && searchQuery.trim() ? (
        isSearching ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : searchResults.length > 0 ? (
          <ScrollView
            style={styles.searchResultsContainer}
            contentContainerStyle={styles.searchResultsContent}
            showsVerticalScrollIndicator={true}>
            <Text style={styles.resultsCount}>
              Found {searchResults.length} verse(s)
            </Text>
            {searchResults.map((verse, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleSearchResultSelect(verse)}>
                <VerseCard verse={verse} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>No results found</Text>
          </View>
        )
      ) : (
        <ChapterReader
          verses={verses}
          book={selectedBook}
          chapter={selectedChapter}
          onPrevChapter={handlePrevChapter}
          onNextChapter={handleNextChapter}
          canGoPrev={canGoPrev}
          canGoNext={canGoNext}
        />
      )}

      {/* Books Drawer */}
      <ChapterDrawer
        visible={drawerVisible}
        currentBook={selectedBook}
        onBookSelect={handleBookSelect}
        onClose={() => setDrawerVisible(false)}
        onOpen={() => setDrawerVisible(true)}
      />
    </View>
  );
};

const createStyles = (theme: any, insets: any) =>
  StyleSheet.create({
    container: {
      position: 'relative',
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    drawerOpenArea: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 40, // Wider area for easier tapping
      zIndex: 1000, // Higher z-index to ensure it's clickable
    },
    searchToggleButton: {
      position: 'absolute',
      top: insets.top + theme.safeArea.topPadding + theme.spacing.md,
      right: theme.spacing.md,
      width: 44,
      height: 44,
      borderRadius: theme.borderRadius.full,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
      zIndex: 100,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
    },
    searchContainer: {
      position: 'absolute',
      top: insets.top + theme.safeArea.topPadding + theme.spacing.md,
      left: theme.spacing.md,
      right: theme.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingHorizontal: theme.spacing.md,
      zIndex: 100,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
    },
    searchInput: {
      flex: 1,
      height: 44,
      fontSize: theme.typography.sizes.body,
      color: theme.colors.text,
      backgroundColor: 'transparent',
      fontFamily: theme.typography.fonts.regular,
    },
    closeSearchButton: {
      marginLeft: theme.spacing.sm,
      padding: theme.spacing.xs,
      minWidth: 32,
      alignItems: 'center',
    },
    searchResultsContainer: {
      flex: 1,
    },
    searchResultsContent: {
      paddingTop: insets.top + theme.safeArea.topPadding + theme.spacing.md + 44 + theme.spacing.md,
      paddingBottom: insets.bottom + theme.safeArea.bottomPadding + theme.safeArea.tabBarHeight + theme.spacing.md,
    },
    resultsCount: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.textSecondary,
      marginHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.md,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    emptyText: {
      fontSize: theme.typography.sizes.body,
      color: theme.colors.textTertiary,
      fontFamily: theme.typography.fonts.regular,
    },
  });
