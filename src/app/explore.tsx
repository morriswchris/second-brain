import Ionicons from '@expo/vector-icons/Ionicons';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useNotes } from '@/notes/notes-context';

const EXAMPLE_QUESTIONS = [
  'What was important for today?',
  'Order my to-dos by priority',
  'What did I note about the trip?',
];

/**
 * Placeholder for Feature 2 (LLM-powered search / ask-your-brain). Kept as an
 * honest "coming soon" surface so the navigation reflects the product roadmap
 * without pretending to do more than capture yet.
 */
export default function SearchScreen() {
  const theme = useTheme();
  const { notes } = useNotes();
  const count = notes.length;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <ThemedText type="eyebrow" themeColor="tint">
              Ask your brain
            </ThemedText>
            <ThemedText type="largeTitle">Search</ThemedText>
          </View>

          <View
            accessibilityRole="search"
            accessibilityState={{ disabled: true }}
            style={[styles.searchField, { backgroundColor: theme.backgroundElement }]}
          >
            <Ionicons name="search" size={18} color={theme.textTertiary} />
            <ThemedText
              themeColor="textTertiary"
              style={styles.searchPlaceholder}
              numberOfLines={1}
            >
              Ask anything about your notes…
            </ThemedText>
            <View style={[styles.soonBadge, { backgroundColor: theme.tintSoft }]}>
              <ThemedText type="caption" themeColor="tint" style={styles.soonText}>
                Soon
              </ThemedText>
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText type="eyebrow" themeColor="textSecondary">
              You&apos;ll be able to ask
            </ThemedText>
            <View style={styles.examples}>
              {EXAMPLE_QUESTIONS.map((question) => (
                <View
                  key={question}
                  style={[
                    styles.example,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                  ]}
                >
                  <Ionicons name="chatbubble-ellipses-outline" size={16} color={theme.tint} />
                  <ThemedText type="small" style={styles.exampleText}>
                    {question}
                  </ThemedText>
                </View>
              ))}
            </View>
          </View>

          <View
            style={[
              styles.statusCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <View style={[styles.statusIcon, { backgroundColor: theme.tintSoft }]}>
              <Ionicons name="layers-outline" size={20} color={theme.tint} />
            </View>
            <View style={styles.statusText}>
              <ThemedText type="smallBold">
                {count === 0
                  ? 'Nothing to search yet'
                  : `${count} ${count === 1 ? 'thought' : 'thoughts'} ready`}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {count === 0
                  ? 'Capture a few thoughts first, then come back to ask about them.'
                  : 'Everything you capture will be searchable when this arrives.'}
              </ThemedText>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scroll: {
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
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    height: 48,
    paddingLeft: Spacing.three,
    paddingRight: Spacing.two,
    borderRadius: Radius.md,
  },
  searchPlaceholder: {
    flex: 1,
    fontWeight: 400,
  },
  soonBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Radius.pill,
  },
  soonText: {
    fontWeight: 600,
  },
  section: {
    gap: Spacing.two + Spacing.one,
  },
  examples: {
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
  statusCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    flex: 1,
    gap: Spacing.half,
  },
});
