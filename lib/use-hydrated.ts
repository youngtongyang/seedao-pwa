"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * `false` during SSR and the first client render, `true` afterwards.
 *
 * The SSR-safe replacement for the `useState(false)` + `useEffect(setMounted)`
 * pattern — it relies on `useSyncExternalStore`'s separate server snapshot
 * instead of a synchronous setState inside an effect.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
