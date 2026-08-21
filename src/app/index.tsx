import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CaptureInput } from '@/components/capture-input';
import { NoteCard } from '@/components/note-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useNotes } from '@/notes/notes-context';

export default function CaptureScreen() {
  const { notes, ready, addNote, removeNote } = useNotes();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.content}>
            <ThemedView style={styles.header}>
              <ThemedText type="subtitle">Capture</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Get it out of your head. It&apos;s saved offline, instantly.
              </ThemedText>
            </ThemedView>

            <CaptureInput onCapture={addNote} />

            <FlatList
              style={styles.list}
              data={notes}
              keyExtractor={(note) => note.id}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => <NoteCard note={item} onDelete={removeNote} />}
              ListEmptyComponent={
                ready ? (
                  <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
                    Nothing captured yet. Type a thought above and hit Capture.
                  </ThemedText>
                ) : null
              }
            />
          </View>
        </KeyboardAvoidingView>
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
    alignItems: 'center',
  },
  flex: {
    flex: 1,
    alignSelf: 'stretch',
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    gap: Spacing.three,
  },
  header: {
    gap: Spacing.one,
  },
  list: {
    flex: 1,
  },
  listContent: {
    gap: Spacing.two,
    paddingTop: Spacing.two,
    paddingBottom: BottomTabInset + Spacing.four,
  },
  empty: {
    textAlign: 'center',
    paddingTop: Spacing.five,
  },
});
