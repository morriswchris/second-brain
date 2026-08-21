import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { formatRelativeTime } from '@/notes/note-utils';
import type { Note } from '@/notes/types';
import { useTheme } from '@/hooks/use-theme';

type NoteCardProps = {
  note: Note;
  onDelete: (id: string) => void;
  /** Injectable clock so relative-time rendering is deterministic in tests. */
  now?: number;
};

/**
 * Presentational card for a single captured thought: the text, when it was
 * captured, and a delete affordance. Pure props-in/callbacks-out so it renders
 * without any store or database.
 */
export function NoteCard({ note, onDelete, now }: NoteCardProps) {
  const theme = useTheme();

  return (
    <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.border }]}>
      <View style={styles.body}>
        <ThemedText style={styles.text}>{note.text}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {formatRelativeTime(note.createdAt, now)}
        </ThemedText>
      </View>
      <Pressable
        onPress={() => onDelete(note.id)}
        accessibilityRole="button"
        accessibilityLabel="Delete thought"
        hitSlop={Spacing.two}
        style={({ pressed }) => [styles.delete, pressed && styles.pressed]}
      >
        <ThemedText type="small" themeColor="textSecondary" style={styles.deleteGlyph}>
          ✕
        </ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Spacing.three,
    padding: Spacing.three,
  },
  body: {
    flex: 1,
    gap: Spacing.one,
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
  },
  delete: {
    padding: Spacing.one,
  },
  deleteGlyph: {
    fontSize: 16,
  },
  pressed: {
    opacity: 0.5,
  },
});
