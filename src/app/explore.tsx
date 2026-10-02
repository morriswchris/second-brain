import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiKeyForm } from '@/components/api-key-form';
import { AppIcon } from '@/components/app-icon';
import { NoteCard } from '@/components/note-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useNotes } from '@/notes/notes-context';
import type { Note } from '@/notes/types';
import { AskBrainError, askBrain, type BrainAnswer } from '@/search/ask-brain';
import { useApiKey } from '@/search/use-api-key';

const EXAMPLE_QUESTIONS = [
  'What was important for today?',
  'Order my to-dos by priority',
  'What ideas have I had this week?',
];

type SearchState =
  | { status: 'idle' }
  | { status: 'loading'; question: string }
  | { status: 'answered'; question: string; answer: BrainAnswer }
  | { status: 'error'; question: string; error: AskBrainError };

/** Ask-your-brain: natural-language questions answered by Claude from your notes. */
export default function SearchScreen() {
  const { notes } = useNotes();
  const { apiKey, saveKey, removeKey } = useApiKey();
  const [question, setQuestion] = useState('');
  const [state, setState] = useState<SearchState>({ status: 'idle' });
  const inFlight = useRef<AbortController | null>(null);

  const ask = async (raw: string) => {
    const q = raw.trim();
    if (!q || !apiKey || notes.length === 0) return;

    inFlight.current?.abort();
    const controller = new AbortController();
    inFlight.current = controller;

    setQuestion(q);
    setState({ status: 'loading', question: q });
    try {
      const answer = await askBrain({ apiKey, question: q, notes, signal: controller.signal });
      if (controller.signal.aborted) return;
      setState({ status: 'answered', question: q, answer });
    } catch (error) {
      if (controller.signal.aborted) return;
      setState({
        status: 'error',
        question: q,
        error:
          error instanceof AskBrainError
            ? error
            : new AskBrainError('api', 'Something went wrong. Try again.'),
      });
    }
  };

  const handleRemoveKey = async () => {
    inFlight.current?.abort();
    setState({ status: 'idle' });
    await removeKey();
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            <View style={styles.header}>
              <ThemedText type="eyebrow" themeColor="tint">
                Ask your brain
              </ThemedText>
              <ThemedText type="largeTitle">Search</ThemedText>
            </View>

            {apiKey === undefined ? null : apiKey === null ? (
              <ApiKeyForm onSave={saveKey} />
            ) : (
              <>
                <AskBar
                  value={question}
                  onChange={setQuestion}
                  onSubmit={() => ask(question)}
                  busy={state.status === 'loading'}
                  disabled={notes.length === 0}
                />

                {notes.length === 0 ? (
                  <EmptyNotesCard />
                ) : state.status === 'idle' ? (
                  <Examples onPick={ask} />
                ) : state.status === 'loading' ? (
                  <LoadingCard count={notes.length} />
                ) : state.status === 'answered' ? (
                  <AnswerView answer={state.answer} notes={notes} />
                ) : (
                  <ErrorCard
                    error={state.error}
                    onRetry={() => ask(state.question)}
                    onReplaceKey={handleRemoveKey}
                  />
                )}

                <KeyFooter onRemove={handleRemoveKey} />
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

function AskBar({
  value,
  onChange,
  onSubmit,
  busy,
  disabled,
}: {
  value: string;
  onChange: (text: string) => void;
  onSubmit: () => void;
  busy: boolean;
  disabled: boolean;
}) {
  const theme = useTheme();
  const canAsk = value.trim().length > 0 && !busy && !disabled;

  return (
    <View style={[styles.askBar, { backgroundColor: theme.backgroundElement }]}>
      <AppIcon name="search" size={18} color={theme.textTertiary} />
      <TextInput
        value={value}
        onChangeText={onChange}
        onSubmitEditing={onSubmit}
        editable={!disabled}
        placeholder="Ask anything about your notes…"
        placeholderTextColor={theme.textTertiary}
        returnKeyType="search"
        accessibilityLabel="Question"
        style={[styles.askInput, { color: theme.text }, webNoOutline]}
      />
      <Pressable
        onPress={onSubmit}
        disabled={!canAsk}
        accessibilityRole="button"
        accessibilityLabel="Ask"
        accessibilityState={{ disabled: !canAsk, busy }}
        hitSlop={Spacing.one}
        style={({ pressed }) => [
          styles.askButton,
          {
            backgroundColor: canAsk ? theme.tint : 'transparent',
            transform: [{ scale: pressed ? 0.92 : 1 }],
          },
        ]}
      >
        {busy ? (
          <ActivityIndicator size="small" color={theme.tint} />
        ) : (
          <AppIcon name="arrow-up" size={18} color={canAsk ? theme.tintText : theme.textTertiary} />
        )}
      </Pressable>
    </View>
  );
}

function Examples({ onPick }: { onPick: (question: string) => void }) {
  const theme = useTheme();

  return (
    <View style={styles.section}>
      <ThemedText type="eyebrow" themeColor="textSecondary">
        Try asking
      </ThemedText>
      <View style={styles.list}>
        {EXAMPLE_QUESTIONS.map((example) => (
          <Pressable
            key={example}
            onPress={() => onPick(example)}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.example,
              {
                backgroundColor: pressed ? theme.backgroundSelected : theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <AppIcon name="chatbubble-ellipses-outline" size={16} color={theme.tint} />
            <ThemedText type="small" style={styles.exampleText}>
              {example}
            </ThemedText>
            <AppIcon name="arrow-forward" size={14} color={theme.textTertiary} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function LoadingCard({ count }: { count: number }) {
  const theme = useTheme();

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      style={[
        styles.card,
        styles.loading,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      <ActivityIndicator color={theme.tint} />
      <ThemedText type="small" themeColor="textSecondary">
        Reading your {count} {count === 1 ? 'note' : 'notes'}…
      </ThemedText>
    </Animated.View>
  );
}

function AnswerView({ answer, notes }: { answer: BrainAnswer; notes: Note[] }) {
  const theme = useTheme();
  const byId = new Map(notes.map((note) => [note.id, note]));
  // A cited note may have been deleted since the answer arrived.
  const cited = answer.noteIds.map((id) => byId.get(id)).filter((n): n is Note => !!n);

  return (
    <Animated.View entering={FadeInDown.springify().damping(18)} style={styles.section}>
      <View
        style={[
          styles.card,
          styles.answer,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <View style={styles.answerLabel}>
          <AppIcon name="sparkles" size={14} color={theme.tint} />
          <ThemedText type="eyebrow" themeColor="tint">
            Answer
          </ThemedText>
        </View>
        <ThemedText style={styles.answerText}>{answer.answer}</ThemedText>
      </View>

      {cited.length > 0 && (
        <View style={styles.section}>
          <ThemedText type="eyebrow" themeColor="textSecondary">
            From your notes
          </ThemedText>
          <View style={styles.list}>
            {cited.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </View>
        </View>
      )}
    </Animated.View>
  );
}

function ErrorCard({
  error,
  onRetry,
  onReplaceKey,
}: {
  error: AskBrainError;
  onRetry: () => void;
  onReplaceKey: () => void;
}) {
  const theme = useTheme();
  const isAuth = error.kind === 'auth';

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.answerLabel}>
        <AppIcon name="alert-circle-outline" size={16} color={theme.danger} />
        <ThemedText type="smallBold">Couldn’t get an answer</ThemedText>
      </View>
      <ThemedText type="small" themeColor="textSecondary">
        {error.message}
      </ThemedText>
      <Pressable
        onPress={isAuth ? onReplaceKey : onRetry}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.secondaryButton,
          { backgroundColor: theme.tintSoft, opacity: pressed ? 0.8 : 1 },
        ]}
      >
        <ThemedText type="smallBold" themeColor="tint">
          {isAuth ? 'Enter a new key' : 'Try again'}
        </ThemedText>
      </Pressable>
    </View>
  );
}

function EmptyNotesCard() {
  const theme = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <ThemedText type="smallBold">Nothing to search yet</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Capture a few thoughts first, then come back to ask about them.
      </ThemedText>
    </View>
  );
}

function KeyFooter({ onRemove }: { onRemove: () => void }) {
  const theme = useTheme();

  return (
    <View style={styles.footer}>
      <AppIcon name="lock-closed-outline" size={12} color={theme.textTertiary} />
      <ThemedText type="caption" themeColor="textTertiary" style={styles.footerText}>
        Using your Anthropic key. Notes are sent to Anthropic when you ask.
      </ThemedText>
      <Pressable onPress={onRemove} accessibilityRole="button" hitSlop={Spacing.two}>
        <ThemedText type="caption" themeColor="tint">
          Remove key
        </ThemedText>
      </Pressable>
    </View>
  );
}

const webNoOutline = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three + Spacing.one,
    paddingTop: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.five,
    gap: Spacing.four,
  },
  header: {
    gap: Spacing.one,
  },
  askBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    height: 52,
    paddingLeft: Spacing.three,
    paddingRight: Spacing.one + Spacing.half,
    borderRadius: Radius.md,
  },
  askInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
  },
  askButton: {
    width: 38,
    height: 38,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    gap: Spacing.two + Spacing.one,
  },
  list: {
    gap: Spacing.two,
  },
  example: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three - Spacing.one,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  exampleText: {
    flex: 1,
    fontWeight: 400,
  },
  card: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  loading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  answer: {
    gap: Spacing.two + Spacing.one,
  },
  answerLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + Spacing.half,
  },
  answerText: {
    fontSize: 17,
    lineHeight: 25,
    fontWeight: 400,
  },
  secondaryButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
    marginTop: Spacing.one,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + Spacing.half,
  },
  footerText: {
    flex: 1,
  },
});
