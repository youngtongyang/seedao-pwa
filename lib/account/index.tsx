"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import { useHydrated } from "@/lib/use-hydrated";
import type { AuthUser } from "@/lib/api/types";

const STORAGE_KEY = "seedao.account";

type AccountState = {
  isMember: boolean;
  user: AuthUser | null;
  agentClaimed: boolean;
};

const EMPTY: AccountState = { isMember: false, user: null, agentClaimed: false };

type AccountContextValue = AccountState & {
  /** True once persisted state has loaded — gate member-only UI on this. */
  hydrated: boolean;
  isLoggedIn: boolean;
  activateMembership: () => void;
  setUser: (user: AuthUser) => void;
  claimAgent: () => void;
  logout: () => void;
  reset: () => void;
};

const AccountContext = createContext<AccountContextValue | null>(null);

// Persisted account state, exposed as an external store. The snapshot is cached
// so `useSyncExternalStore` gets a stable reference (avoids re-render loops) and
// reads need no synchronous setState inside an effect.
const listeners = new Set<() => void>();
let cache: AccountState | null = null;

function readState(): AccountState {
  if (typeof window === "undefined") return EMPTY;
  if (cache) return cache;
  let next: AccountState = EMPTY;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) next = { ...EMPTY, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  cache = next;
  return next;
}

function writeState(next: AccountState) {
  cache = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  for (const l of listeners) l();
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

function update(updater: (s: AccountState) => AccountState) {
  writeState(updater(readState()));
}

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const state = useSyncExternalStore(subscribe, readState, () => EMPTY);
  const hydrated = useHydrated();

  const activateMembership = useCallback(
    () => update((s) => ({ ...s, isMember: true })),
    [],
  );
  const setUser = useCallback(
    (user: AuthUser) => update((s) => ({ ...s, user })),
    [],
  );
  const claimAgent = useCallback(
    () => update((s) => ({ ...s, agentClaimed: true })),
    [],
  );
  const logout = useCallback(() => update((s) => ({ ...s, user: null })), []);
  const reset = useCallback(() => update(() => EMPTY), []);

  const value = useMemo<AccountContextValue>(
    () => ({
      ...state,
      hydrated,
      isLoggedIn: state.user !== null,
      activateMembership,
      setUser,
      claimAgent,
      logout,
      reset,
    }),
    [state, hydrated, activateMembership, setUser, claimAgent, logout, reset],
  );

  return (
    <AccountContext.Provider value={value}>{children}</AccountContext.Provider>
  );
}

export function useAccount() {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error("useAccount must be used within an AccountProvider");
  return ctx;
}
