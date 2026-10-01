import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
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
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.body}>
        <ThemedText style={styles.text}>{note.text}</ThemedText>
        <ThemedText type="caption" themeColor="textTertiary">
          {formatRelativeTime(note.createdAt, now)}
        </ThemedText>
      </View>
      <Pressable
        onPress={() => onDelete(note.id)}
        accessibilityRole="button"
        accessibilityLabel="Delete thought"
        hitSlop={Spacing.two}
        style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
          styles.delete,
          (pressed || hovered) && { backgroundColor: theme.backgroundElement },
        ]}
      >
        {({ pressed }) => (
          <Ionicons name="close" size={16} color={pressed ? theme.danger : theme.textTertiary} />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.md,
    paddingVertical: Spacing.three - Spacing.one,
    paddingLeft: Spacing.three,
    paddingRight: Spacing.two,
  },
  body: {
    flex: 1,
    gap: Spacing.one,
  },
  text: {
    fontSize: 16,
    lineHeight: 23,
    fontWeight: 400,
  },
  delete: {
    width: 28,
    height: 28,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
