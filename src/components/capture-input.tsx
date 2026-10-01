import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type CaptureInputProps = {
  /** Called with the raw text when the user captures a thought. */
  onCapture: (text: string) => void;
};

/**
 * The core "unload" control: a low-friction, always-ready composer with an
 * inline send button. Clears and (on native) stays focused after each capture
 * so thoughts can be dumped one after another without ceremony.
 */
export function CaptureInput({ onCapture }: CaptureInputProps) {
  const theme = useTheme();
  const [text, setText] = useState('');
  const [focused, setFocused] = useState(false);
  const canCapture = text.trim().length > 0;

  const handleCapture = () => {
    if (!canCapture) return;
    onCapture(text);
    setText('');
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: focused ? theme.tint : theme.border,
          boxShadow: `0 8px 24px ${theme.shadow}`,
        },
      ]}
    >
      <TextInput
        value={text}
        onChangeText={setText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="What's on your mind?"
        placeholderTextColor={theme.textTertiary}
        multiline
        autoFocus={Platform.OS !== 'web'}
        // Enter submits; Shift+Enter (hardware keyboards / web) makes a newline.
        onSubmitEditing={handleCapture}
        blurOnSubmit={false}
        submitBehavior="submit"
        style={[styles.input, { color: theme.text }, webNoOutline]}
      />
      <View style={styles.footer}>
        <ThemedText type="caption" themeColor="textTertiary" style={styles.hint}>
          {Platform.OS === 'web'
            ? 'Enter to capture · Shift+Enter for a new line'
            : 'Saved on this device'}
        </ThemedText>
        <Pressable
          onPress={handleCapture}
          disabled={!canCapture}
          accessibilityRole="button"
          accessibilityLabel="Capture thought"
          accessibilityState={{ disabled: !canCapture }}
          hitSlop={Spacing.two}
          style={({ pressed }) => [
            styles.send,
            {
              backgroundColor: canCapture ? theme.tint : theme.backgroundElement,
              transform: [{ scale: pressed ? 0.92 : 1 }],
            },
          ]}
        >
          <Ionicons
            name="arrow-up"
            size={20}
            color={canCapture ? theme.tintText : theme.textTertiary}
          />
        </Pressable>
      </View>
    </View>
  );
}

// react-native-web draws the browser focus ring inside the card; the card's
// own accent border already shows focus.
const webNoOutline = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null;

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingTop: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two + Spacing.one,
    gap: Spacing.two,
  },
  input: {
    minHeight: 72,
    maxHeight: 200,
    padding: 0,
    fontSize: 17,
    lineHeight: 24,
    textAlignVertical: 'top',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  hint: {
    flexShrink: 1,
  },
  send: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
