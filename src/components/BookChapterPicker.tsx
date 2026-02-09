import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  TouchableWithoutFeedback,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {BibleService} from '../services/bibleService';
import {useTheme} from '../theme/useTheme';
import {getShadowOpacity} from '../theme/utils';
import {ArrowLeftIcon} from './icons/ArrowLeftIcon';

interface BookChapterPickerProps {
  visible: boolean;
  currentBook: string | null;
  currentChapter: number | null;
  onSelect: (book: string, chapter: number) => void;
  onClose: () => void;
}

export const BookChapterPicker: React.FC<BookChapterPickerProps> = ({
  visible,
  currentBook,
  currentChapter,
  onSelect,
  onClose,
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [selectedBook, setSelectedBook] = useState<string | null>(currentBook);
  const [chapters, setChapters] = useState<number[]>([]);
  const [books] = useState<string[]>(BibleService.getAllBooks());
  const styles = createStyles(theme, insets);

  useEffect(() => {
    if (selectedBook) {
      const bookChapters = BibleService.getChapters(selectedBook);
      setChapters(bookChapters);
    } else {
      setChapters([]);
    }
  }, [selectedBook]);

  useEffect(() => {
    if (visible) {
      setSelectedBook(currentBook);
    }
  }, [visible, currentBook]);

  const handleBookSelect = (book: string) => {
    setSelectedBook(book);
  };

  const handleChapterSelect = (chapter: number) => {
    if (selectedBook) {
      onSelect(selectedBook, chapter);
      onClose();
    }
  };

  const renderBookItem = ({item}: {item: string}) => {
    const isSelected = item === selectedBook;
    return (
      <TouchableOpacity
        style={[styles.bookItem, isSelected && styles.bookItemSelected]}
        onPress={() => handleBookSelect(item)}>
        <Text
          style={[
            styles.bookItemText,
            isSelected && styles.bookItemTextSelected,
          ]}>
          {item}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderChapterItem = ({item}: {item: number}) => {
    const isSelected = item === currentChapter && selectedBook === currentBook;
    return (
      <TouchableOpacity
        style={[styles.chapterItem, isSelected && styles.chapterItemSelected]}
        onPress={() => handleChapterSelect(item)}>
        <Text
          style={[
            styles.chapterItemText,
            isSelected && styles.chapterItemTextSelected,
          ]}>
          {item}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.container}>
              <View style={styles.handle} />
              <View style={styles.header}>
                <Text style={styles.title}>
                  {selectedBook ? 'Select Chapter' : 'Select Book'}
                </Text>
                {selectedBook && (
                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => setSelectedBook(null)}>
                    <View style={styles.backButtonContent}>
                      <ArrowLeftIcon size={16} color={theme.colors.primary} />
                      <Text style={styles.backButtonText}>Back</Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>

              {selectedBook ? (
                <View style={styles.chaptersContainer}>
                  <Text style={styles.bookTitle}>{selectedBook}</Text>
                  <FlatList
                    data={chapters}
                    keyExtractor={item => item.toString()}
                    renderItem={renderChapterItem}
                    numColumns={6}
                    contentContainerStyle={styles.chaptersGrid}
                    showsVerticalScrollIndicator={true}
                  />
                </View>
              ) : (
                <FlatList
                  data={books}
                  keyExtractor={item => item}
                  renderItem={renderBookItem}
                  contentContainerStyle={styles.booksList}
                  showsVerticalScrollIndicator={true}
                />
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const createStyles = (theme: any, insets: any) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    container: {
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: theme.borderRadius.xl,
      borderTopRightRadius: theme.borderRadius.xl,
      maxHeight: '80%',
      paddingBottom: insets.bottom + theme.spacing.md,
    },
    handle: {
      width: 40,
      height: 4,
      backgroundColor: theme.colors.border,
      borderRadius: theme.borderRadius.full,
      alignSelf: 'center',
      marginTop: theme.spacing.md,
      marginBottom: theme.spacing.lg,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.md,
    },
    title: {
      fontSize: theme.typography.sizes.xl,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.text,
      flex: 1,
    },
    backButton: {
      padding: theme.spacing.xs,
    },
    backButtonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    backButtonText: {
      fontSize: theme.typography.sizes.body,
      color: theme.colors.primary,
      fontWeight: theme.typography.weights.semibold,
    },
    booksList: {
      paddingHorizontal: theme.spacing.md,
      paddingBottom: theme.spacing.md,
    },
    bookItem: {
      backgroundColor: theme.colors.surfaceElevated,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    bookItemSelected: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    bookItemText: {
      fontSize: theme.typography.sizes.body,
      fontWeight: theme.typography.weights.medium,
      color: theme.colors.text,
    },
    bookItemTextSelected: {
      color: theme.colors.surface,
    },
    chaptersContainer: {
      flex: 1,
      paddingHorizontal: theme.spacing.lg,
    },
    bookTitle: {
      fontSize: theme.typography.sizes.lg,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.text,
      marginBottom: theme.spacing.lg,
      textAlign: 'center',
    },
    chaptersGrid: {
      paddingBottom: theme.spacing.md,
    },
    chapterItem: {
      flex: 1,
      aspectRatio: 1,
      backgroundColor: theme.colors.surfaceElevated,
      borderRadius: theme.borderRadius.md,
      margin: theme.spacing.xs,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
      minWidth: 50,
      maxWidth: 80,
    },
    chapterItemSelected: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    chapterItemText: {
      fontSize: theme.typography.sizes.body,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.text,
    },
    chapterItemTextSelected: {
      color: theme.colors.surface,
    },
  });
