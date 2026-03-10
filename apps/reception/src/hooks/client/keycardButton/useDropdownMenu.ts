"use client";

import type { MouseEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import { showToast } from "../../../utils/toastUtils";

interface UseDropdownMenuProps {
  isDisabled: boolean;
}

interface UseDropdownMenuReturn {
  menuOpen: boolean;
  menuVisible: boolean;
  menuPosition: { top: number; left: number } | null;
  buttonRef: React.RefObject<HTMLButtonElement>;
  handleMenuToggle: (event: MouseEvent<HTMLButtonElement>) => void;
  closeMenu: () => void;
  setTrackedTimeout: (fn: () => void, delay: number) => ReturnType<typeof setTimeout>;
}

/**
 * Manages dropdown menu open/close state, position, visibility (fade),
 * and tracked timeouts for KeycardDepositButton.
 */
export function useDropdownMenu({ isDisabled }: UseDropdownMenuProps): UseDropdownMenuReturn {
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [menuVisible, setMenuVisible] = useState<boolean>(false);
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  const buttonRef = useRef<HTMLButtonElement>(null);

  /* Track active timers so they can be cleared on unmount */
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const setTrackedTimeout = useCallback(
    (fn: () => void, delay: number): ReturnType<typeof setTimeout> => {
      const id = setTimeout(() => {
        fn();
        timeoutsRef.current = timeoutsRef.current.filter((t) => t !== id);
      }, delay);
      timeoutsRef.current.push(id);
      return id;
    },
    [timeoutsRef]
  );

  /* Clear all tracked timeouts on unmount */
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  /* Dropdown fade-in / out */
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (menuOpen) setMenuVisible(true);
    else timer = setTrackedTimeout(() => setMenuVisible(false), 200);
    return () => {
      if (timer) {
        clearTimeout(timer);
        timeoutsRef.current = timeoutsRef.current.filter((t) => t !== timer);
      }
    };
  }, [menuOpen, setTrackedTimeout]);

  const handleMenuToggle = useCallback(
    (event: MouseEvent<HTMLButtonElement>): void => {
      event.stopPropagation();
      if (isDisabled) {
        showToast("Keycard deposit action not available.", "warning");
        return;
      }
      if (!menuOpen && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setMenuPosition({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
        });
      } else {
        setTrackedTimeout(() => setMenuPosition(null), 200);
      }
      setMenuOpen((prev) => !prev);
    },
    [isDisabled, menuOpen, setTrackedTimeout]
  );

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    setTrackedTimeout(() => setMenuPosition(null), 200);
  }, [setTrackedTimeout]);

  return {
    menuOpen,
    menuVisible,
    menuPosition,
    buttonRef,
    handleMenuToggle,
    closeMenu,
    setTrackedTimeout,
  };
}
