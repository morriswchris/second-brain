import { useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type CaptureInputProps = {
  /** Called with the raw text when the user captures a thought. */
  onCapture: (text: string) => void;
};

/**
 * The core "unload" control: a low-friction, always-ready text box plus a
 * Capture button. Clears and (on native) stays focused after each capture so
 * thoughts can be dumped one after another without ceremony.
 */
export function CaptureInput({ onCapture }: CaptureInputProps) {
  const theme = useTheme();
  const [text, setText] = useState('');
  const canCapture = text.trim().length > 0;

  const handleCapture = () => {
    if (!canCapture) return;
    onCapture(text);
    setText('');
  };

  return (
    <ThemedView style={styles.wrapper}>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="What's on your mind?"
        placeholderTextColor={theme.textSecondary}
        multiline
        autoFocus={Platform.OS !== 'web'}
        // Enter submits; Shift+Enter (hardware keyboards / web) makes a newline.
        onSubmitEditing={handleCapture}
        blurOnSubmit={false}
        submitBehavior="submit"
        style={[
          styles.input,
          {
            color: theme.text,
            backgroundColor: theme.backgroundElement,
            borderColor: theme.border,
          },
        ]}
      />
      <Pressable
        onPress={handleCapture}
        disabled={!canCapture}
        accessibilityRole="button"
        accessibilityLabel="Capture thought"
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: theme.tint, opacity: !canCapture ? 0.4 : pressed ? 0.85 : 1 },
        ]}
      >
        <ThemedText type="smallBold" style={{ color: theme.tintText }}>
          Capture
        </ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.two,
  },
  input: {
    minHeight: 96,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Spacing.three,
    padding: Spacing.three,
    fontSize: 17,
    lineHeight: 24,
    textAlignVertical: 'top',
  },
  button: {
    alignSelf: 'flex-end',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.five,
    minWidth: 120,
    alignItems: 'center',
  },
});
