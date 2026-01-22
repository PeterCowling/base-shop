import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { get, getDatabase, ref, update } from "firebase/database";

import { AuthContext } from "./AuthContext";

type ThemeMode = "light" | "dark";

interface DarkModeContextValue {
  dark: boolean;
  mode: ThemeMode;
  toggleDark: () => void;
  setMode: (mode: ThemeMode) => void;
}

const DarkModeContext = createContext<DarkModeContextValue | undefined>(
  undefined
);

const GLOBAL_STORAGE_KEY = "darkMode";
const USER_STORAGE_PREFIX = "darkMode:user:";
const USER_PREFERENCE_ROOT = (userName: string): string =>
  `userPrefs/${userName}`;

const isThemeMode = (value: unknown): value is ThemeMode =>
  value === "dark" || value === "light";

const parseStoredMode = (value: string | null): ThemeMode | null => {
  if (value === null) {
    return null;
  }

  try {
    const parsed = JSON.parse(value);
    if (isThemeMode(parsed)) {
      return parsed;
    }
    if (parsed === true) {
      return "dark";
    }
    if (parsed === false) {
      return "light";
    }
  } catch {
    if (isThemeMode(value)) {
      return value;
    }
  }

  return null;
};

const readPreference = (key: string): ThemeMode | null => {
  try {
    return parseStoredMode(localStorage.getItem(key));
  } catch {
    return null;
  }
};

const writePreference = (key: string, value: ThemeMode): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* noop */
  }
};

const getUserStorageKey = (userName: string): string =>
  `${USER_STORAGE_PREFIX}${userName}`;

const parseRemotePreference = (value: unknown): ThemeMode | null => {
  if (isThemeMode(value)) {
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

    if (isThemeMode(record.themeMode)) {
      return record.themeMode;
    }

    if (typeof record.darkMode === "boolean") {
      return record.darkMode ? "dark" : "light";
    }
  }

  return null;
};

export const DarkModeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const auth = useContext(AuthContext);
  const user = auth?.user ?? null;
  const [mode, setMode] = useState<ThemeMode>(() => {
    const stored = readPreference(GLOBAL_STORAGE_KEY);
    return stored ?? "light";
  });
  const [userPreferenceReady, setUserPreferenceReady] = useState(false);
  const userOverrideRef = useRef(false);

  const setThemeMode = useCallback((nextMode: ThemeMode) => {
    userOverrideRef.current = true;
    setMode(nextMode);
  }, []);

  const toggleDark = useCallback((): void => {
    userOverrideRef.current = true;
    setMode((current) => (current === "dark" ? "light" : "dark"));
  }, []);

  useEffect(() => {
    if (!user) {
      setUserPreferenceReady(false);
      return;
    }

    setUserPreferenceReady(false);
    userOverrideRef.current = false;

    const userStorageKey = getUserStorageKey(user.user_name);
    const localUserPreference = readPreference(userStorageKey);

    if (localUserPreference !== null) {
      setMode(localUserPreference);
    }

    let cancelled = false;
    const db = getDatabase();
    get(ref(db, USER_PREFERENCE_ROOT(user.user_name)))
      .then((snap) => {
        if (cancelled) return;
        if (snap.exists()) {
          const remotePreference = parseRemotePreference(snap.val());
          if (remotePreference && !userOverrideRef.current) {
            setMode(remotePreference);
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
  }, [user]);

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const isDark = mode === "dark";
    root.classList.toggle("theme-dark", isDark);
    root.classList.toggle("dark", isDark);
    body.classList.toggle("dark", isDark);
    root.style.colorScheme = isDark ? "dark" : "light";
    root.dataset.theme = mode;
    body.dataset.theme = mode;
    writePreference(GLOBAL_STORAGE_KEY, mode);
  }, [mode]);

  useEffect(() => {
    if (!user || !userPreferenceReady) {
      return;
    }

    const userStorageKey = getUserStorageKey(user.user_name);
    writePreference(userStorageKey, mode);
    const db = getDatabase();
    update(ref(db, USER_PREFERENCE_ROOT(user.user_name)), {
      themeMode: mode,
      darkMode: mode === "dark",
    }).catch((err) => console.error("Failed to save theme mode", err));
  }, [mode, user, userPreferenceReady]);

  const contextValue = useMemo(
    () => ({
      mode,
      dark: mode === "dark",
      toggleDark,
      setMode: setThemeMode,
    }),
    [mode, toggleDark, setThemeMode]
  );

  return (
    <DarkModeContext.Provider value={contextValue}>
      {children}
    </DarkModeContext.Provider>
  );
};

export function useDarkMode(): DarkModeContextValue {
  const context = useContext(DarkModeContext);
  if (!context) {
    throw new Error("useDarkMode must be used within a DarkModeProvider");
  }
  return context;
}
