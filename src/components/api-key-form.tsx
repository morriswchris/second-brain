import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppIcon } from '@/components/app-icon';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ApiKeyFormProps = {
  onSave: (key: string) => Promise<void>;
};

/**
 * One-time setup for search: the user pastes their own Anthropic API key,
 * which is kept in secure storage on the device.
 */
export function ApiKeyForm({ onSave }: ApiKeyFormProps) {
  const theme = useTheme();
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canSave = value.trim().length > 0 && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      await onSave(value);
      setValue('');
    } catch {
      setError('Couldn’t save the key on this device. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.titleRow}>
        <View style={[styles.icon, { backgroundColor: theme.tintSoft }]}>
          <AppIcon name="key-outline" size={18} color={theme.tint} />
        </View>
        <View style={styles.titleText}>
          <ThemedText type="smallBold">Connect Claude</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Search uses your own Anthropic API key.
          </ThemedText>
        </View>
      </View>

      <TextInput
        value={value}
        onChangeText={setValue}
        placeholder="sk-ant-…"
        placeholderTextColor={theme.textTertiary}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="off"
        onSubmitEditing={handleSave}
        accessibilityLabel="Anthropic API key"
        style={[
          styles.input,
          { color: theme.text, backgroundColor: theme.backgroundElement },
          webNoOutline,
        ]}
      />

      {error && (
        <ThemedText type="caption" themeColor="danger">
          {error}
        </ThemedText>
      )}

      <Pressable
        onPress={handleSave}
        disabled={!canSave}
        accessibilityRole="button"
        accessibilityLabel="Save API key"
        accessibilityState={{ disabled: !canSave }}
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: canSave ? theme.tint : theme.backgroundElement,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        {saving ? (
          <ActivityIndicator color={theme.tintText} />
        ) : (
          <ThemedText
            type="smallBold"
            style={{ color: canSave ? theme.tintText : theme.textTertiary }}
          >
            Save key
          </ThemedText>
        )}
      </Pressable>

      <ThemedText type="caption" themeColor="textTertiary">
        Create a key at console.anthropic.com under API keys. It stays on this device. When you ask
        a question, your notes are sent to Anthropic to answer it.
      </ThemedText>
    </View>
  );
}

const webNoOutline = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null;

const styles = StyleSheet.create({
  card: {
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: {
    flex: 1,
    gap: Spacing.half,
  },
  input: {
    height: 48,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.md,
    fontSize: 16,
  },
  button: {
    height: 44,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
