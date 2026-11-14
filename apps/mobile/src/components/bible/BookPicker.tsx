import { useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { BOOKS, formatRef, parseReference, TRANSLATIONS } from '../../constants/books';
import { useBookmarks } from '../../hooks/queries';
import type { BibleBook, PassageRef, TranslationId } from '../../types/bible';
import { colors, radii, spacing, typography } from '../../theme/tokens';

type Props = {
  visible: boolean;
  translation: TranslationId;
  onClose: () => void;
  onSelect: (ref: PassageRef) => void;
  onTranslation: (t: TranslationId) => void;
};

export default function BookPicker({ visible, translation, onClose, onSelect, onTranslation }: Props) {
  const [query, setQuery] = useState('');
  const [book, setBook] = useState<BibleBook | null>(null);
  const bookmarks = useBookmarks();

  const close = () => {
    setBook(null);
    setQuery('');
    onClose();
  };
  const pick = (ref: PassageRef) => {
    onSelect(ref);
    close();
  };

  const parsed = query.trim() ? parseReference(query) : null;
  const filtered = query.trim() ? BOOKS.filter((b) => b.name.toLowerCase().includes(query.trim().toLowerCase())) : BOOKS;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={close}>
      <SafeAreaView style={styles.sheet} edges={['top', 'bottom']}>
        <View style={styles.header}>
          {book ? (
            <Pressable onPress={() => setBook(null)} hitSlop={12}>
              <Ionicons name="chevron-back" size={24} color={colors.Gold} />
            </Pressable>
          ) : (
            <View style={{ width: 24 }} />
          )}
          <Text style={styles.headerTitle}>{book ? book.name : 'Go to passage'}</Text>
          <Pressable onPress={close} hitSlop={12}>
            <Text style={styles.link}>Done</Text>
          </Pressable>
        </View>

        {book ? (
          <ScrollView contentContainerStyle={styles.grid}>
            {Array.from({ length: book.chapters }, (_, i) => i + 1).map((ch) => (
              <Pressable key={ch} style={styles.chapterCell} onPress={() => pick({ bookId: book.id, chapter: ch })}>
                <Text style={styles.chapterText}>{ch}</Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(b) => b.id}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={
              <View style={{ gap: spacing.md, paddingBottom: spacing.md }}>
                <TextInput
                  style={styles.search}
                  placeholder="Search a book or reference (e.g. John 3:16)"
                  placeholderTextColor={colors.muted}
                  value={query}
                  onChangeText={setQuery}
                  autoCorrect={false}
                  returnKeyType="go"
                  onSubmitEditing={() => parsed && pick(parsed)}
                />
                {parsed && (
                  <Pressable style={styles.goRow} onPress={() => pick(parsed)}>
                    <Ionicons name="arrow-forward-circle" size={20} color={colors.Gold} />
                    <Text style={styles.rowText}>Go to {formatRef(parsed)}</Text>
                  </Pressable>
                )}

                {!query && (
                  <>
                    <Text style={styles.label}>Translation</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs }}>
                      {TRANSLATIONS.map((t) => (
                        <Pressable
                          key={t.id}
                          onPress={() => onTranslation(t.id)}
                          style={[styles.pill, t.id === translation && styles.pillActive]}
                        >
                          <Text style={[styles.pillText, t.id === translation && { color: colors.surface }]}>
                            {t.id.toUpperCase()}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>

                    {!!bookmarks.data?.length && (
                      <>
                        <Text style={styles.label}>Bookmarks</Text>
                        {bookmarks.data.slice(0, 5).map((b) => (
                          <Pressable
                            key={`${b.book_id}${b.chapter}${b.verse}`}
                            style={styles.goRow}
                            onPress={() => pick({ bookId: b.book_id, chapter: b.chapter, verseStart: b.verse || null })}
                          >
                            <Ionicons name="bookmark" size={16} color={colors.Gold} />
                            <Text style={styles.rowText}>
                              {formatRef({ bookId: b.book_id, chapter: b.chapter, verseStart: b.verse || null })}
                            </Text>
                          </Pressable>
                        ))}
                      </>
                    )}
                    <Text style={styles.label}>Books</Text>
                  </>
                )}
              </View>
            }
            renderItem={({ item }) => (
              <Pressable style={styles.bookRow} onPress={() => setBook(item)}>
                <Text style={styles.rowText}>{item.name}</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.inactive} />
              </Pressable>
            )}
            contentContainerStyle={{ padding: spacing.lg }}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: colors.paper },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  headerTitle: { fontFamily: typography.fontFamily.body, fontSize: typography.fontSize.bodySmall, color: colors.Ink },
  link: { fontFamily: typography.fontFamily.body, color: colors.Gold, fontSize: 16 },
  search: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.sm,
    fontFamily: typography.fontFamily.body,
    fontSize: 15,
    color: colors.Ink,
  },
  label: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.caption,
    color: colors.Gold,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: spacing.xs,
  },
  pill: { paddingVertical: 6, paddingHorizontal: spacing.sm, borderRadius: radii.full, borderWidth: 1, borderColor: colors.Gold },
  pillActive: { backgroundColor: colors.Gold },
  pillText: { fontFamily: typography.fontFamily.body, fontSize: 13, color: colors.Gold },
  goRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.xxs },
  bookRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  rowText: { fontFamily: typography.fontFamily.body, fontSize: 16, color: colors.Ink },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: spacing.lg, gap: spacing.sm },
  chapterCell: {
    width: 56,
    height: 56,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chapterText: { fontFamily: typography.fontFamily.body, fontSize: 16, color: colors.Ink },
});
