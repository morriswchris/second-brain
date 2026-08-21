import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TaskEditModal } from '@/components/task-edit-modal';
import { TaskRow } from '@/components/task-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { sortActive } from '@/store/task-utils';
import type { Task } from '@/store/types';
import { useTasks } from '@/store/use-tasks';

export default function TasksScreen() {
  const theme = useTheme();
  const tasks = useTasks((s) => s.tasks);
  const addTask = useTasks((s) => s.addTask);
  const toggleDone = useTasks((s) => s.toggleDone);
  const toggleImportant = useTasks((s) => s.toggleImportant);
  const editTask = useTasks((s) => s.editTask);
  const removeTask = useTasks((s) => s.removeTask);

  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState<Task | null>(null);

  const active = useMemo(() => sortActive(tasks), [tasks]);

  const submit = () => {
    addTask(draft);
    setDraft('');
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ThemedText type="subtitle" style={styles.heading}>
          Tasks
        </ThemedText>

        <View style={[styles.addRow, { borderColor: theme.border }]}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={submit}
            placeholder="Add a task…"
            placeholderTextColor={theme.textSecondary}
            returnKeyType="done"
            style={[styles.input, { color: theme.text }]}
            accessibilityLabel="New task"
          />
          <Pressable
            onPress={submit}
            style={[styles.addButton, { backgroundColor: theme.tint }]}
            accessibilityRole="button"
            accessibilityLabel="Add task"
          >
            <ThemedText style={styles.addLabel} type="smallBold">
              Add
            </ThemedText>
          </Pressable>
        </View>

        <FlatList
          data={active}
          keyExtractor={(t) => t.id}
          renderItem={({ item }) => (
            <TaskRow
              task={item}
              onToggleDone={toggleDone}
              onToggleImportant={toggleImportant}
              onPress={setEditing}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <ThemedText themeColor="textSecondary" style={styles.empty}>
              Nothing here yet. Capture whatever’s on your mind above ↑
            </ThemedText>
          }
        />
      </SafeAreaView>

      <TaskEditModal
        task={editing}
        onClose={() => setEditing(null)}
        onSave={editTask}
        onDelete={removeTask}
      />
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
  heading: {
    paddingTop: Spacing.three,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Spacing.three,
    paddingLeft: Spacing.three,
    paddingRight: Spacing.one,
    paddingVertical: Spacing.one,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Spacing.two,
  },
  addButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
  },
  addLabel: {
    color: '#ffffff',
  },
  listContent: {
    paddingBottom: BottomTabInset + Spacing.four,
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
});
