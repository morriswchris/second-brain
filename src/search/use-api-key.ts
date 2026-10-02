import { useCallback, useEffect, useState } from 'react';

import { clearApiKey, getApiKey, setApiKey } from '@/search/key-store';

type ApiKeyState = {
  /** `undefined` while loading from storage, `null` when none is saved. */
  apiKey: string | null | undefined;
  saveKey: (value: string) => Promise<void>;
  removeKey: () => Promise<void>;
};

export function useApiKey(): ApiKeyState {
  const [apiKey, setKey] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    let active = true;
    getApiKey().then((stored) => {
      if (active) setKey(stored);
    });
    return () => {
      active = false;
    };
  }, []);

  const saveKey = useCallback(async (value: string) => {
    const trimmed = value.trim();
    await setApiKey(trimmed);
    setKey(trimmed);
  }, []);

  const removeKey = useCallback(async () => {
    await clearApiKey();
    setKey(null);
  }, []);

  return { apiKey, saveKey, removeKey };
}
