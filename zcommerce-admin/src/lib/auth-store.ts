import { useSyncExternalStore } from "react";
import type { AuthUser, Scope } from "@/types";

export interface Session {
  access_token: string;
  refresh_token: string;
  user: AuthUser;
  /** Tenant slug used at login (merchant scope only). */
  tenant_slug?: string;
}

type State = Record<Scope, Session | null>;

const KEY = (scope: Scope) => `zc.auth.${scope}`;

function read(scope: Scope): Session | null {
  try {
    const raw = localStorage.getItem(KEY(scope));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Session;
    if (!parsed?.access_token || !parsed?.refresh_token) return null;
    return parsed;
  } catch {
    return null;
  }
}

let state: State = {
  tenant: read("tenant"),
  system: read("system"),
};

const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function persist(scope: Scope, session: Session | null) {
  try {
    if (session) localStorage.setItem(KEY(scope), JSON.stringify(session));
    else localStorage.removeItem(KEY(scope));
  } catch {
    /* storage unavailable */
  }
}

export const authStore = {
  get(scope: Scope): Session | null {
    return state[scope];
  },
  set(scope: Scope, session: Session | null) {
    state = { ...state, [scope]: session };
    persist(scope, session);
    emit();
  },
  update(scope: Scope, patch: Partial<Session>) {
    const cur = state[scope];
    if (!cur) return;
    authStore.set(scope, { ...cur, ...patch });
  },
  clear(scope: Scope) {
    authStore.set(scope, null);
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

// Keep tabs in sync.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === KEY("tenant") || e.key === KEY("system")) {
      state = { tenant: read("tenant"), system: read("system") };
      emit();
    }
  });
}

export function useSession(scope: Scope): Session | null {
  return useSyncExternalStore(
    authStore.subscribe,
    () => state[scope],
    () => state[scope],
  );
}
