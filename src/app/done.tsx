import { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TaskRow } from '@/components/task-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { sortCompleted } from '@/store/task-utils';
import { useTasks } from '@/store/use-tasks';

export default function DoneScreen() {
  const theme = useTheme();
  const tasks = useTasks((s) => s.tasks);
  const toggleDone = useTasks((s) => s.toggleDone);
  const toggleImportant = useTasks((s) => s.toggleImportant);
  const removeTask = useTasks((s) => s.removeTask);
  const clearCompleted = useTasks((s) => s.clearCompleted);

  const completed = useMemo(() => sortCompleted(tasks), [tasks]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <ThemedText type="subtitle">Done</ThemedText>
          {completed.length > 0 && (
            <Pressable
              onPress={clearCompleted}
              hitSlop={Spacing.two}
              accessibilityRole="button"
              accessibilityLabel="Clear all completed tasks"
            >
              <ThemedText themeColor="textSecondary" type="smallBold">
                Clear all
              </ThemedText>
            </Pressable>
          )}
        </View>

        <FlatList
          data={completed}
          keyExtractor={(t) => t.id}
          renderItem={({ item }) => (
            <TaskRow
              task={item}
              onToggleDone={toggleDone}
              onToggleImportant={toggleImportant}
              onPress={() => removeTask(item.id)}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <ThemedText themeColor="textSecondary" style={styles.empty}>
              Completed tasks land here. Check one off on the Tasks tab.
            </ThemedText>
          }
        />
        {completed.length > 0 && (
          <ThemedText
            themeColor="textSecondary"
            type="small"
            style={[styles.hint, { color: theme.textSecondary }]}
          >
            Tap a task to remove it, or the circle to send it back.
          </ThemedText>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
    alignSelf: 'stretch',
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.three,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.three,
  },
  listContent: {
    paddingBottom: Spacing.three,
    flexGrow: 1,
  },
  separator: {
    height: Spacing.two,
  },
  empty: {
    textAlign: 'center',
    marginTop: Spacing.five,
    paddingHorizontal: Spacing.four,
  },
  hint: {
    textAlign: 'center',
    paddingBottom: BottomTabInset + Spacing.two,
  },
});
