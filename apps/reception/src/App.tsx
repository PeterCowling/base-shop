"use client";

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";

import CustomToastContainer from "./components/appNav/CustomToastContainer";
import AuthenticatedApp from "./components/AuthenticatedApp";
import Login from "./components/Login";
import LoadingSpinner from "./components/LoadingSpinner";

import { useAuth } from "./context/AuthContext";
import useInactivityLogout from "./hooks/client/useInactivityLogoutClient";
import { useFirebaseDatabase } from "./services/useFirebase";
import type { ModalName } from "./types/ModalName";

interface AppProps {
  children: ReactNode;
}

function App({ children }: AppProps) {
  const { user, status, logout } = useAuth();
  const [activeModal, setActiveModal] = useState<ModalName | null>(null);

  useFirebaseDatabase();

  const router = useRouter();
  const pathname = usePathname();

  const modals: ModalName[] = useMemo(
    () => ["operations", "till", "management", "man"],
    []
  );

  const isArrowKeyCapturingElement = useCallback(
    (el: EventTarget | null): boolean => {
      if (!el || !(el instanceof HTMLElement)) {
        return false;
      }
      const tagName = el.tagName.toLowerCase();
      const isInput = tagName === "input" || tagName === "textarea";
      const isContentEditable = el.isContentEditable;
      const isRange = (el as HTMLInputElement).type === "range";
      return isInput || isContentEditable || isRange;
    },
    []
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent): void => {
      if (!user) return;
      if (isArrowKeyCapturingElement(e.target)) return;

      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (activeModal === null) {
          setActiveModal(modals[0] ?? null);
        } else {
          const currentIndex = modals.indexOf(activeModal);
          const nextIndex = (currentIndex + 1) % modals.length;
          setActiveModal(modals[nextIndex] ?? null);
        }
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (activeModal === null) {
          setActiveModal(modals[modals.length - 1] ?? null);
        } else {
          const currentIndex = modals.indexOf(activeModal);
          const prevIndex = (currentIndex - 1 + modals.length) % modals.length;
          setActiveModal(modals[prevIndex] ?? null);
        }
      }
    },
    [user, activeModal, modals, isArrowKeyCapturingElement]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (user && pathname !== "/") {
      localStorage.setItem("lastPath", pathname);
    }
  }, [user, pathname]);

  const handleLoginSuccess = useCallback((): void => {
    const lastPath = localStorage.getItem("lastPath");
    if (lastPath && lastPath !== "/") {
      router.push(lastPath);
    } else {
      router.push("/bar");
      localStorage.setItem("lastPath", "/bar");
    }
  }, [router]);

  const handleLogout = useCallback(async (): Promise<void> => {
    await logout();
    setActiveModal(null);
    router.push("/");
  }, [router, logout]);

  const closeModal = useCallback((): void => {
    setActiveModal(null);
  }, []);

  useInactivityLogout(!!user, handleLogout, 60000);

  // Convert new user format to legacy format for AuthenticatedApp
  const legacyUser = useMemo(() => {
    if (!user) return null;
    return {
      email: user.email,
      user_name: user.displayName ?? user.email,
      roles: user.roles,
    };
  }, [user]);

  // Show loading spinner while checking auth state
  if (status === "loading") {
    return (
      <>
        <CustomToastContainer />
        <LoadingSpinner />
      </>
    );
  }

  return (
    <>
      <CustomToastContainer />
      {user && legacyUser ? (
        <AuthenticatedApp
          user={legacyUser}
          activeModal={activeModal}
          closeModal={closeModal}
          handleLogout={handleLogout}
        >
          {children}
        </AuthenticatedApp>
      ) : (
        <Login onLoginSuccess={handleLoginSuccess} />
      )}
    </>
  );
}

export default memo(App);
