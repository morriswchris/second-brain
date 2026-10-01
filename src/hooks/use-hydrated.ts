/** Native has no static render pass, so the client is always "hydrated". */
export function useHydrated() {
  return true;
}
