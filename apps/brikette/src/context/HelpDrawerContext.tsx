// src/context/HelpDrawerContext.tsx
/* ────────────────────────────────────────────────────────────────
   Global drawer state (desktop + mobile nav share this)
   – If a component calls useHelpDrawer **without** a provider
     (e.g. isolated unit-test or Storybook), we fall back to a
     self-contained local state and log a dev-time warning.
   – This prevents hard runtime crashes while still nudging devs
     to wrap the component tree in <HelpDrawerProvider>.
   ──────────────────────────────────────────────────────────────── */

import {
  createContext,
  memo,
  useCallback,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */
interface DrawerState {
  open: boolean;
  toggle: () => void;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

/* ------------------------------------------------------------------ */
/*  Context & Provider                                                */
/* ------------------------------------------------------------------ */
const HelpDrawerContext = createContext<DrawerState | null>(null);

export function HelpDrawerProvider({
  children,
  /** Optional initial state (handy for tests or SSR) */
  defaultOpen = false,
}: {
  children: ReactNode;
  defaultOpen?: boolean;
}): JSX.Element {
  const [open, setOpen] = useState(defaultOpen);
  const toggle = useCallback(() => setOpen((v) => !v), []);

  const value = useMemo<DrawerState>(() => ({ open, toggle, setOpen }), [open, toggle]);

  return <HelpDrawerContext.Provider value={value}>{children}</HelpDrawerContext.Provider>;
}

/* ------------------------------------------------------------------ */
/*  Hook                                                              */
/* ------------------------------------------------------------------ */
/**
 * Access the global help-drawer state.
 * Falls back to local state in dev/test when no provider is present.
 */
export function useHelpDrawer(): DrawerState {
  const ctx = useContext(HelpDrawerContext);

  /* Fallback hooks are **always** called, satisfying react-hooks linting */
  const [fallbackOpen, setFallbackOpen] = useState(false);
  const toggleFallback = useCallback(() => setFallbackOpen((v) => !v), []);
  const fallback = useMemo<DrawerState>(
    () => ({
      open: fallbackOpen,
      toggle: toggleFallback,
      setOpen: setFallbackOpen,
    }),
    [fallbackOpen, toggleFallback]
  );

  if (ctx === null) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "useHelpDrawer: no <HelpDrawerProvider> found in the React tree. " +
          "Using a local fallback state. Wrap your component in " +
          "<HelpDrawerProvider> to remove this warning."
      );
    }
    return fallback;
  }

  return ctx;
}

export default memo(HelpDrawerProvider);
