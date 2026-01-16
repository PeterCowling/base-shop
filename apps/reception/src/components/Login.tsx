"use client";

import {
  FormEvent,
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { useAuth, type AuthStatus } from "../context/AuthContext";
import { useDarkMode } from "../context/DarkModeContext";
import { readJson, writeJson, removeItem } from "../lib/offline/storage";
import type { DevicePin } from "../types/domains/userDomain";

const DEVICE_PIN_KEY = "reception:devicePin";
const PIN_LENGTH = 6;

async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

interface LoginProps {
  onLoginSuccess?: () => void;
}

function Login({ onLoginSuccess }: LoginProps) {
  const { login, status } = useAuth();
  const { toggleDark, dark } = useDarkMode();

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Device PIN state
  const [devicePin, setDevicePin] = useState<DevicePin | null>(null);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [showPinUnlock, setShowPinUnlock] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);

  const emailRef = useRef<HTMLInputElement>(null);
  const pinRef = useRef<HTMLInputElement>(null);

  // Load device PIN on mount
  useEffect(() => {
    const stored = readJson<DevicePin>(DEVICE_PIN_KEY);
    if (stored) {
      setDevicePin(stored);
      setShowPinUnlock(true);
    }
  }, []);

  // Focus appropriate input
  useEffect(() => {
    if (showPinUnlock) {
      pinRef.current?.focus();
    } else {
      emailRef.current?.focus();
    }
  }, [showPinUnlock]);

  const handleEmailLogin = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setError(null);
      setIsSubmitting(true);

      const result = await login(email, password);

      setIsSubmitting(false);

      if (result.success) {
        // Ask if they want to set up device PIN (if not already set)
        if (!devicePin) {
          setShowPinSetup(true);
        } else {
          onLoginSuccess?.();
        }
      } else {
        setError(result.error ?? "Login failed");
      }
    },
    [email, password, login, devicePin, onLoginSuccess]
  );

  const handlePinSetup = useCallback(
    async (pin: string) => {
      if (pin.length !== PIN_LENGTH) return;

      const pinHash = await hashPin(pin);
      const newDevicePin: DevicePin = {
        uid: "", // Will be set on next login
        pinHash,
        createdAt: Date.now(),
      };

      writeJson(DEVICE_PIN_KEY, newDevicePin);
      setDevicePin(newDevicePin);
      setShowPinSetup(false);
      onLoginSuccess?.();
    },
    [onLoginSuccess]
  );

  const handlePinUnlock = useCallback(
    async (pin: string) => {
      if (!devicePin || pin.length !== PIN_LENGTH) return;

      const pinHash = await hashPin(pin);
      if (pinHash === devicePin.pinHash) {
        setPinError(null);
        // Device PIN is valid, but we still need to check Firebase session
        // The auth state listener will handle the actual auth check
        onLoginSuccess?.();
      } else {
        setPinError("Invalid PIN");
        setPinInput("");
        pinRef.current?.focus();
      }
    },
    [devicePin, onLoginSuccess]
  );

  const handleSkipPinSetup = useCallback(() => {
    setShowPinSetup(false);
    onLoginSuccess?.();
  }, [onLoginSuccess]);

  const handleClearDevicePin = useCallback(() => {
    removeItem(DEVICE_PIN_KEY);
    setDevicePin(null);
    setShowPinUnlock(false);
    setPinInput("");
  }, []);

  const handlePinInputChange = useCallback(
    (value: string) => {
      const digits = value.replace(/\D/g, "").slice(0, PIN_LENGTH);
      setPinInput(digits);
      setPinError(null);

      if (digits.length === PIN_LENGTH) {
        if (showPinSetup) {
          handlePinSetup(digits);
        } else {
          handlePinUnlock(digits);
        }
      }
    },
    [showPinSetup, handlePinSetup, handlePinUnlock]
  );

  // Render PIN setup screen
  if (showPinSetup) {
    return (
      <LoginContainer dark={dark} toggleDark={toggleDark}>
        <h1 className="text-2xl font-semibold tracking-wide text-gray-900 dark:text-darkAccentGreen">
          Set up quick unlock
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-darkAccentGreen">
          Create a 6-digit PIN for faster access on this device.
        </p>

        <div className="mt-6">
          <input
            ref={pinRef}
            type="password"
            inputMode="numeric"
            autoComplete="off"
            maxLength={PIN_LENGTH}
            value={pinInput}
            onChange={(e) => handlePinInputChange(e.target.value)}
            placeholder="Enter 6-digit PIN"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-center text-2xl tracking-widest focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-darkBorder dark:bg-darkSurface dark:text-darkAccentGreen"
          />
        </div>

        <button
          type="button"
          onClick={handleSkipPinSetup}
          className="mt-4 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-darkBorder dark:text-darkAccentGreen dark:hover:bg-darkBorder"
        >
          Skip for now
        </button>
      </LoginContainer>
    );
  }

  // Render PIN unlock screen
  if (showPinUnlock && devicePin) {
    return (
      <LoginContainer dark={dark} toggleDark={toggleDark}>
        <h1 className="text-2xl font-semibold tracking-wide text-gray-900 dark:text-darkAccentGreen">
          Welcome back
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-darkAccentGreen">
          Enter your device PIN to unlock.
        </p>

        <div className="mt-6">
          <input
            ref={pinRef}
            type="password"
            inputMode="numeric"
            autoComplete="off"
            maxLength={PIN_LENGTH}
            value={pinInput}
            onChange={(e) => handlePinInputChange(e.target.value)}
            placeholder="Enter PIN"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-center text-2xl tracking-widest focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-darkBorder dark:bg-darkSurface dark:text-darkAccentGreen"
          />
        </div>

        {pinError && (
          <p role="alert" className="mt-2 text-sm font-medium text-red-600">
            {pinError}
          </p>
        )}

        <button
          type="button"
          onClick={handleClearDevicePin}
          className="mt-4 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-darkBorder dark:text-darkAccentGreen dark:hover:bg-darkBorder"
        >
          Sign in with email instead
        </button>
      </LoginContainer>
    );
  }

  // Render email/password login
  return (
    <LoginContainer dark={dark} toggleDark={toggleDark}>
      <h1 className="text-2xl font-semibold tracking-wide text-gray-900 dark:text-darkAccentGreen">
        Welcome back
      </h1>
      <p className="mt-1 text-sm text-gray-600 dark:text-darkAccentGreen">
        Sign in with your email and password.
      </p>

      <form onSubmit={handleEmailLogin} className="mt-6 space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 dark:text-darkAccentGreen"
          >
            Email
          </label>
          <input
            ref={emailRef}
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-darkBorder dark:bg-darkSurface dark:text-darkAccentGreen"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 dark:text-darkAccentGreen"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-darkBorder dark:bg-darkSurface dark:text-darkAccentGreen"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm font-medium text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting || status === "loading"}
          className="w-full rounded-lg bg-primary-600 px-4 py-2 font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 dark:bg-darkAccentGreen dark:text-darkBg dark:hover:bg-darkAccentGreen/90"
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </LoginContainer>
  );
}

interface LoginContainerProps {
  children: React.ReactNode;
  dark: boolean;
  toggleDark: () => void;
}

function LoginContainer({ children, dark, toggleDark }: LoginContainerProps) {
  return (
    <div className="relative isolate flex min-h-dvh w-full items-center justify-center overflow-hidden bg-gray-100 dark:bg-darkBg">
      <img
        src="/landing_positano.avif"
        alt="Colourful panorama of Positano"
        className="absolute inset-0 -z-20 h-full w-full object-cover object-center md:object-bottom"
      />

      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-white/80 via-white/40 to-white/10 backdrop-blur-sm dark:from-darkSurface/80 dark:via-darkSurface/40 dark:to-darkSurface/10" />

      <div className="relative z-10 w-full max-w-md rounded-3xl bg-white/80 px-10 py-8 shadow-xl backdrop-blur-md dark:bg-darkSurface">
        <button
          type="button"
          onClick={toggleDark}
          aria-pressed={dark}
          className="absolute right-4 top-4 text-sm font-semibold text-gray-600 dark:text-darkAccentGreen"
        >
          {dark ? "Light" : "Dark"} Mode
        </button>

        {children}
      </div>
    </div>
  );
}

export default memo(Login);
