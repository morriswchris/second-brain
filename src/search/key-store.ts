import * as SecureStore from 'expo-secure-store';

/**
 * The user's own Anthropic API key, kept in the platform keychain/keystore
 * (expo-secure-store ships in Expo Go). It never leaves the device except in
 * requests to the Anthropic API.
 */

const KEY = 'anthropic-api-key';

export async function getApiKey(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(KEY);
  } catch (error) {
    console.warn('[key-store] could not read API key', error);
    return null;
  }
}

export async function setApiKey(value: string): Promise<void> {
  await SecureStore.setItemAsync(KEY, value);
}

export async function clearApiKey(): Promise<void> {
  await SecureStore.deleteItemAsync(KEY);
}
