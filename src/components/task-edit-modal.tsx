import { useState } from 'react';
import { Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Task } from '@/store/types';

type TaskEditModalProps = {
  task: Task | null;
  onClose: () => void;
  onSave: (id: string, patch: { title: string; notes: string }) => void;
  onDelete: (id: string) => void;
};

export function TaskEditModal({ task, onClose, onSave, onDelete }: TaskEditModalProps) {
  return (
    <Modal visible={task !== null} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <ThemedView style={styles.sheet}>
          <SafeAreaView edges={['bottom']}>
            {/* Keyed by id so the form's initial state re-seeds per task, with
                no state-syncing effect. */}
            {task && (
              <EditForm
                key={task.id}
                task={task}
                onClose={onClose}
                onSave={onSave}
                onDelete={onDelete}
              />
            )}
          </SafeAreaView>
        </ThemedView>
      </View>
    </Modal>
  );
}

function EditForm({
  task,
  onClose,
  onSave,
  onDelete,
}: {
  task: Task;
  onClose: () => void;
  onSave: TaskEditModalProps['onSave'];
  onDelete: TaskEditModalProps['onDelete'];
}) {
  const theme = useTheme();
  const [title, setTitle] = useState(task.title);
  const [notes, setNotes] = useState(task.notes);

  const save = () => {
    if (title.trim().length > 0) {
      onSave(task.id, { title, notes });
    }
    onClose();
  };

  return (
    <>
      <ThemedText type="subtitle" style={styles.heading}>
        Edit task
      </ThemedText>

      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="Task title"
        placeholderTextColor={theme.textSecondary}
        style={[styles.input, { color: theme.text, borderColor: theme.border }]}
        autoFocus
      />

      <TextInput
        value={notes}
        onChangeText={setNotes}
        placeholder="Notes (optional)"
        placeholderTextColor={theme.textSecondary}
        multiline
        style={[styles.input, styles.notes, { color: theme.text, borderColor: theme.border }]}
      />

      <View style={styles.actions}>
        <Pressable
          onPress={() => {
            onDelete(task.id);
            onClose();
          }}
          style={styles.button}
          accessibilityRole="button"
          accessibilityLabel="Delete task"
        >
          <ThemedText themeColor="danger" type="smallBold">
            Delete
          </ThemedText>
        </Pressable>

        <View style={styles.rightActions}>
          <Pressable
            onPress={onClose}
            style={styles.button}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
          >
            <ThemedText themeColor="textSecondary" type="smallBold">
              Cancel
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={save}
            style={[styles.button, styles.saveButton, { backgroundColor: theme.tint }]}
            accessibilityRole="button"
            accessibilityLabel="Save task"
          >
            <ThemedText style={styles.saveLabel} type="smallBold">
              Save
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    borderTopLeftRadius: Spacing.four,
    borderTopRightRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  heading: {
    fontSize: 24,
    lineHeight: 30,
  },
  input: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 16,
  },
  notes: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  button: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
  },
  saveButton: {
    paddingHorizontal: Spacing.four,
  },
  saveLabel: {
    color: '#ffffff',
  },
});
