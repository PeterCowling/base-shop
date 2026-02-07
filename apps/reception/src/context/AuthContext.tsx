/* src/context/AuthContext.tsx */
"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { hasAnyRole, isPrivileged } from "../lib/roles";
import {
  getFirebaseAuth,
  type LoginResult,
  loginWithEmailPassword,
  logout as firebaseLogout,
  subscribeToAuthState,
} from "../services/firebaseAuth";
import { useFirebaseApp, useFirebaseDatabase } from "../services/useFirebase";
import type { User, UserRole } from "../types/domains/userDomain";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface ReauthResult {
  success: boolean;
  error?: string;
}

interface AuthContextValue {
  user: User | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  reauthenticate: (password: string) => Promise<ReauthResult>;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  isPrivileged: boolean;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const app = useFirebaseApp();
  const database = useFirebaseDatabase();
  const auth = useMemo(() => getFirebaseAuth(app), [app]);

  // Subscribe to auth state changes
  useEffect(() => {
    const unsubscribe = subscribeToAuthState(auth, database, (authUser) => {
      setUser(authUser);
      setStatus(authUser ? "authenticated" : "unauthenticated");
    });

    return unsubscribe;
  }, [auth, database]);

  const login = useCallback(
    async (email: string, password: string): Promise<LoginResult> => {
      setStatus("loading");
      const result = await loginWithEmailPassword(auth, database, email, password);
      if (result.success && result.user) {
        setUser(result.user);
        setStatus("authenticated");
      } else {
        setStatus("unauthenticated");
      }
      return result;
    },
    [auth, database]
  );

  const logout = useCallback(async (): Promise<void> => {
    await firebaseLogout(auth);
    setUser(null);
    setStatus("unauthenticated");
  }, [auth]);

  const checkRole = useCallback(
    (role: UserRole): boolean => {
      if (!user || !user.roles) return false;
      return user.roles.includes(role);
    },
    [user]
  );

  const checkAnyRole = useCallback(
    (roles: UserRole[]): boolean => {
      return hasAnyRole(user, roles);
    },
    [user]
  );

  const privileged = useMemo(() => isPrivileged(user), [user]);

  const reauthenticate = useCallback(
    async (password: string): Promise<ReauthResult> => {
      if (!user) return { success: false, error: "No user logged in" };
      try {
        const result = await loginWithEmailPassword(auth, database, user.email, password);
        if (result.success) {
          return { success: true };
        }
        return { success: false, error: result.error ?? "Authentication failed" };
      } catch (err) {
        return { success: false, error: (err as Error).message ?? "Authentication failed" };
      }
    },
    [user, auth, database]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      login,
      logout,
      reauthenticate,
      hasRole: checkRole,
      hasAnyRole: checkAnyRole,
      isPrivileged: privileged,
    }),
    [user, status, login, logout, reauthenticate, checkRole, checkAnyRole, privileged]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }
  return context;
}

// Legacy hook for backwards compatibility during migration
// Returns user in the old format expected by existing components
export function useLegacyAuth(): {
  user: { email: string; user_name: string } | null;
  setUser: React.Dispatch<React.SetStateAction<{ email: string; user_name: string } | null>>;
} {
  const { user } = useAuth();

  // Convert new user format to legacy format
  const legacyUser = useMemo(() => {
    if (!user) return null;
    return {
      email: user.email,
      user_name: user.displayName ?? user.email,
    };
  }, [user]);

  // No-op setter for backwards compatibility
  const setUser = useCallback(() => {
    console.warn("setUser is deprecated. Use login/logout from useAuth instead.");
  }, []);

  return { user: legacyUser, setUser };
}
