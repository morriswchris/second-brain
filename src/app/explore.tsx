import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useNotes } from '@/notes/notes-context';

/**
 * Placeholder for Feature 2 (LLM-powered search / ask-your-brain). Kept as an
 * honest "coming soon" surface so the navigation reflects the product roadmap
 * without pretending to do more than capture yet.
 */
export default function SearchScreen() {
  const { notes } = useNotes();
  const count = notes.length;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <ThemedText type="subtitle">Search</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.center}>
            {count === 0
              ? 'Capture a few thoughts first — then you’ll be able to ask questions about them here.'
              : `${count} thought${count === 1 ? '' : 's'} captured and ready.`}
          </ThemedText>

          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">Coming soon</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Ask in plain language — &ldquo;what was the important thing for today?&rdquo; or
              &ldquo;order these by priority&rdquo; — and get the right notes back.
            </ThemedText>
          </ThemedView>
        </View>
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
  content: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.six,
    gap: Spacing.three,
  },
  center: {
    textAlign: 'left',
  },
  card: {
    gap: Spacing.two,
    padding: Spacing.four,
    borderRadius: Spacing.three,
    marginTop: Spacing.three,
  },
});
