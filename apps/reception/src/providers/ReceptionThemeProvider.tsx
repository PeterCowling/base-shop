"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { get, getDatabase, ref, update } from "firebase/database";

import { useTheme } from "@acme/ui/hooks/useTheme";
import { ThemeProvider } from "@acme/ui/providers/ThemeProvider";

import { useAuth } from "@/context/AuthContext";

type LegacyThemeMode = "light" | "dark";
type ThemeMode = "light" | "dark" | "system";

interface ReceptionThemeContextValue {
  dark: boolean;
  mode: ThemeMode;
  toggleDark: () => void;
  setMode: (mode: ThemeMode) => void;
  isDark: boolean;
  resolvedMode: "light" | "dark";
}

const ReceptionThemeContext = createContext<
  ReceptionThemeContextValue | undefined
>(undefined);

const GLOBAL_STORAGE_KEY = "darkMode";
const USER_STORAGE_PREFIX = "darkMode:user:";
const PLATFORM_THEME_MODE_KEY = "theme-mode";
const PLATFORM_LEGACY_THEME_KEY = "theme";
const USER_PREFERENCE_ROOT = (userName: string): string =>
  `userPrefs/${userName}`;

const isLegacyThemeMode = (value: unknown): value is LegacyThemeMode =>
  value === "dark" || value === "light";

const parseStoredMode = (value: string | null): LegacyThemeMode | null => {
  if (value === null) {
    return null;
  }

  try {
    const parsed = JSON.parse(value);
    if (isLegacyThemeMode(parsed)) {
      return parsed;
    }
    if (parsed === true) {
      return "dark";
    }
    if (parsed === false) {
      return "light";
    }
  } catch {
    if (isLegacyThemeMode(value)) {
      return value;
    }
  }

  return null;
};

const readPreference = (key: string): LegacyThemeMode | null => {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return parseStoredMode(window.localStorage.getItem(key));
  } catch {
    return null;
  }
};

const writePreference = (key: string, value: LegacyThemeMode): void => {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* noop */
  }
};

const writeCanonicalMode = (mode: ThemeMode): void => {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(PLATFORM_THEME_MODE_KEY, mode);
    window.localStorage.setItem(PLATFORM_LEGACY_THEME_KEY, mode);
  } catch {
    /* noop */
  }
};

const getUserStorageKey = (userName: string): string =>
  `${USER_STORAGE_PREFIX}${userName}`;

const parseRemotePreference = (value: unknown): LegacyThemeMode | null => {
  if (isLegacyThemeMode(value)) {
    return value;
  }

  if (typeof value === "boolean") {
    return value ? "dark" : "light";
  }

  if (value && typeof value === "object") {
    const record = value as {
      themeMode?: unknown;
      darkMode?: unknown;
    };

    if (isLegacyThemeMode(record.themeMode)) {
      return record.themeMode;
    }

    if (typeof record.darkMode === "boolean") {
      return record.darkMode ? "dark" : "light";
    }
  }

  return null;
};

const resolveUserName = (
  user: ReturnType<typeof useAuth>["user"]
): string | null => {
  if (!user) {
    return null;
  }
  return user.user_name ?? user.displayName ?? user.email;
};

const bootstrapCanonicalMode = (userName: string | null): void => {
  const bootstrapMode =
    (userName ? readPreference(getUserStorageKey(userName)) : null) ??
    readPreference(GLOBAL_STORAGE_KEY) ??
    "dark"; // Reception defaults to dark mode

  writeCanonicalMode(bootstrapMode);
};

function ReceptionThemeBridge({
  children,
}: {
  children: React.ReactNode;
}) {
  const { mode, setMode, isDark, resolvedMode } = useTheme();
  const { user } = useAuth();
  const [userPreferenceReady, setUserPreferenceReady] = useState(false);
  const userOverrideRef = useRef(false);
  const userName = useMemo(() => resolveUserName(user), [user]);
  const applyMode = useCallback(
    (nextMode: ThemeMode) => {
      setMode(nextMode);
    },
    [setMode]
  );

  const setReceptionMode = useCallback(
    (nextMode: ThemeMode) => {
      userOverrideRef.current = true;
      applyMode(nextMode);
    },
    [applyMode]
  );

  const toggleDark = useCallback(() => {
    userOverrideRef.current = true;
    applyMode(isDark ? "light" : "dark");
  }, [applyMode, isDark]);

  useLayoutEffect(() => {
    if (!userName) {
      const globalPreference = readPreference(GLOBAL_STORAGE_KEY);
      if (globalPreference) {
        writeCanonicalMode(globalPreference);
        queueMicrotask(() => applyMode(globalPreference));
      }
      setUserPreferenceReady(false);
      return;
    }

    setUserPreferenceReady(false);
    userOverrideRef.current = false;

    const userStorageKey = getUserStorageKey(userName);
    const localUserPreference = readPreference(userStorageKey);
    if (localUserPreference !== null) {
      writeCanonicalMode(localUserPreference);
      queueMicrotask(() => applyMode(localUserPreference));
    }
  }, [applyMode, userName]);

  useEffect(() => {
    if (!userName) {
      return;
    }

    let cancelled = false;
    const db = getDatabase();
    const userStorageKey = getUserStorageKey(userName);
    get(ref(db, USER_PREFERENCE_ROOT(userName)))
      .then((snap) => {
        if (cancelled) {
          return;
        }

        if (snap.exists()) {
          const remotePreference = parseRemotePreference(snap.val());
          if (remotePreference && !userOverrideRef.current) {
            writeCanonicalMode(remotePreference);
            applyMode(remotePreference);
            writePreference(userStorageKey, remotePreference);
          }
        }

        setUserPreferenceReady(true);
      })
      .catch((err) => {
        console.error("Failed to load theme mode", err);
        setUserPreferenceReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [applyMode, userName]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const root = document.documentElement;
    const body = document.body;
    const persistedMode: LegacyThemeMode = isDark ? "dark" : "light";

    root.classList.toggle("theme-dark", isDark);
    root.classList.toggle("dark", isDark);
    body.classList.toggle("theme-dark", isDark);
    body.classList.toggle("dark", isDark);

    root.style.colorScheme = persistedMode;
    root.dataset.theme = mode;
    body.dataset.theme = persistedMode;

    writePreference(GLOBAL_STORAGE_KEY, persistedMode);
    writeCanonicalMode(mode);
  }, [isDark, mode]);

  useEffect(() => {
    if (!userName || !userPreferenceReady) {
      return;
    }

    const persistedMode: LegacyThemeMode = isDark ? "dark" : "light";
    const userStorageKey = getUserStorageKey(userName);

    writePreference(userStorageKey, persistedMode);
    const db = getDatabase();
    update(ref(db, USER_PREFERENCE_ROOT(userName)), {
      themeMode: persistedMode,
      darkMode: persistedMode === "dark",
    }).catch((err) => console.error("Failed to save theme mode", err));
  }, [isDark, userName, userPreferenceReady]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const userStorageKey = userName ? getUserStorageKey(userName) : null;
    const handleStorage = (event: StorageEvent) => {
      if (!event.key) {
        return;
      }

      if (userStorageKey && event.key === userStorageKey) {
        const userMode = parseStoredMode(event.newValue);
        if (userMode) {
          writeCanonicalMode(userMode);
          applyMode(userMode);
        }
        return;
      }

      if (!userStorageKey && event.key === GLOBAL_STORAGE_KEY) {
        const globalMode = parseStoredMode(event.newValue);
        if (globalMode) {
          writeCanonicalMode(globalMode);
          applyMode(globalMode);
        }
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [applyMode, userName]);

  const value = useMemo<ReceptionThemeContextValue>(
    () => ({
      dark: isDark,
      mode,
      toggleDark,
      setMode: setReceptionMode,
      isDark,
      resolvedMode,
    }),
    [isDark, mode, resolvedMode, setReceptionMode, toggleDark]
  );

  return (
    <ReceptionThemeContext.Provider value={value}>
      {children}
    </ReceptionThemeContext.Provider>
  );
}

export const ReceptionThemeProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const { user } = useAuth();
  const userName = useMemo(() => resolveUserName(user), [user]);
  bootstrapCanonicalMode(userName);

  return (
    <ThemeProvider>
      <ReceptionThemeBridge>{children}</ReceptionThemeBridge>
    </ThemeProvider>
  );
};

export function useReceptionTheme(): ReceptionThemeContextValue {
  const context = useContext(ReceptionThemeContext);
  if (!context) {
    throw new Error(
      "useReceptionTheme must be used within a ReceptionThemeProvider"
    );
  }
  return context;
}
