import { useMemo } from 'react';
import { KeyboardAvoidingView, Platform, SectionList, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/app-icon';
import { CaptureInput } from '@/components/capture-input';
import { NoteCard } from '@/components/note-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { groupNotesByDay } from '@/notes/note-utils';
import { useNotes } from '@/notes/notes-context';

const itemLayout = LinearTransition.springify().damping(18).stiffness(180);

export default function CaptureScreen() {
  const { notes, ready, addNote, removeNote } = useNotes();
  const sections = useMemo(() => groupNotesByDay(notes), [notes]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.content}>
            <Header count={notes.length} />

            <CaptureInput onCapture={addNote} />

            <SectionList
              style={styles.list}
              sections={sections}
              keyExtractor={(note) => note.id}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              showsVerticalScrollIndicator={false}
              stickySectionHeadersEnabled={false}
              contentContainerStyle={styles.listContent}
              renderSectionHeader={({ section }) => (
                <ThemedText type="eyebrow" themeColor="textSecondary" style={styles.sectionHeader}>
                  {section.title}
                </ThemedText>
              )}
              renderItem={({ item }) => (
                <Animated.View
                  entering={FadeInDown.springify().damping(18)}
                  exiting={FadeOut.duration(160)}
                  layout={itemLayout}
                  style={styles.item}
                >
                  <NoteCard note={item} onDelete={removeNote} />
                </Animated.View>
              )}
              ListEmptyComponent={ready ? <EmptyState /> : null}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

function Header({ count }: { count: number }) {
  const theme = useTheme();
  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <View style={styles.header}>
      <View style={styles.headerText}>
        <ThemedText type="eyebrow" themeColor="tint">
          {today}
        </ThemedText>
        <ThemedText type="largeTitle">Capture</ThemedText>
      </View>
      {count > 0 && (
        <View style={[styles.countPill, { backgroundColor: theme.backgroundElement }]}>
          <ThemedText type="caption" themeColor="textSecondary">
            {count} {count === 1 ? 'thought' : 'thoughts'}
          </ThemedText>
        </View>
      )}
    </View>
  );
}

function EmptyState() {
  const theme = useTheme();

  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: theme.tintSoft }]}>
        <AppIcon name="sparkles" size={24} color={theme.tint} />
      </View>
      <ThemedText type="smallBold" style={styles.emptyTitle}>
        A clear head starts here
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.emptyBody}>
        Type anything above — a task, an idea, something you don&apos;t want to forget. It&apos;s
        saved on this device instantly.
      </ThemedText>
    </View>
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
    paddingHorizontal: Spacing.three + Spacing.one,
    paddingTop: Spacing.four,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: Spacing.three,
    paddingBottom: Spacing.two,
  },
  headerText: {
    flexShrink: 1,
    gap: Spacing.one,
  },
  countPill: {
    paddingHorizontal: Spacing.two + Spacing.one,
    paddingVertical: Spacing.one,
    borderRadius: Radius.pill,
    marginBottom: Spacing.one + Spacing.half,
  },
  list: {
    flex: 1,
    marginHorizontal: -(Spacing.three + Spacing.one),
  },
  listContent: {
    paddingHorizontal: Spacing.three + Spacing.one,
    paddingBottom: BottomTabInset + Spacing.five,
  },
  sectionHeader: {
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two + Spacing.half,
  },
  item: {
    paddingBottom: Spacing.two,
  },
  empty: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingTop: Spacing.six,
    paddingHorizontal: Spacing.four,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  emptyTitle: {
    fontSize: 16,
  },
  emptyBody: {
    textAlign: 'center',
    maxWidth: 300,
  },
});
