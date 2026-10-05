import { createContext, useContext, type ReactNode } from "react";
import type { Scope } from "@/types";

const ScopeContext = createContext<Scope>("tenant");

export function ScopeProvider({ scope, children }: { scope: Scope; children: ReactNode }) {
  return <ScopeContext.Provider value={scope}>{children}</ScopeContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useScope(): Scope {
  return useContext(ScopeContext);
}
