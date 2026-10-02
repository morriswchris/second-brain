/**
 * Web fallback for the API key store. expo-secure-store has no web
 * implementation, so the browser dev build keeps the key in localStorage —
 * acceptable for local development, not for a hosted deployment.
 */

const KEY = 'second-brain:anthropic-api-key';

export async function getApiKey(): Promise<string | null> {
  try {
    return globalThis.localStorage?.getItem(KEY) ?? null;
  } catch {
    return null;
  }
}

export async function setApiKey(value: string): Promise<void> {
  globalThis.localStorage?.setItem(KEY, value);
}

export async function clearApiKey(): Promise<void> {
  try {
    globalThis.localStorage?.removeItem(KEY);
  } catch {
    // Storage blocked: nothing to clear.
  }
}
