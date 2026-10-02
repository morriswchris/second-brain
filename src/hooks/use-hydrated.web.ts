import { useEffect, useState } from 'react';

/**
 * False during web static rendering and the first client render, true after
 * mount. Use it to defer output that can't match between server and client.
 */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);

  // Intentional one-time "have we hydrated on the client?" flag, mirroring
  // `use-color-scheme.web.ts`.
  useEffect(() => {
    setHydrated(true);
  }, []);

  return hydrated;
}
