import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Task } from '@/store/types';

type TaskRowProps = {
  task: Task;
  onToggleDone: (id: string) => void;
  onToggleImportant: (id: string) => void;
  onPress: (task: Task) => void;
};

export function TaskRow({ task, onToggleDone, onToggleImportant, onPress }: TaskRowProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={() => onPress(task)}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: pressed ? theme.backgroundSelected : theme.backgroundElement },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Edit task: ${task.title}`}
    >
      <Pressable
        onPress={() => onToggleDone(task.id)}
        hitSlop={Spacing.two}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: task.done }}
        accessibilityLabel={task.done ? 'Mark as not done' : 'Mark as done'}
      >
        <ThemedText
          style={[styles.checkbox, { color: task.done ? theme.tint : theme.textSecondary }]}
        >
          {task.done ? '●' : '○'}
        </ThemedText>
      </Pressable>

      <View style={styles.titleWrap}>
        <ThemedText
          numberOfLines={2}
          themeColor={task.done ? 'textSecondary' : 'text'}
          style={task.done ? styles.doneTitle : undefined}
        >
          {task.title}
        </ThemedText>
      </View>

      <Pressable
        onPress={() => onToggleImportant(task.id)}
        hitSlop={Spacing.two}
        accessibilityRole="button"
        accessibilityLabel={task.important ? 'Remove important flag' : 'Mark important'}
      >
        <ThemedText
          style={[styles.star, { color: task.important ? theme.tint : theme.textSecondary }]}
        >
          {task.important ? '★' : '☆'}
        </ThemedText>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
  checkbox: {
    fontSize: 22,
    lineHeight: 26,
  },
  titleWrap: {
    flex: 1,
  },
  doneTitle: {
    textDecorationLine: 'line-through',
  },
  star: {
    fontSize: 20,
    lineHeight: 24,
  },
});
