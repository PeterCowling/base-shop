"use client";

import {
  type FormEvent,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Input } from "@acme/design-system";
import { Button } from "@acme/design-system/atoms";

import { useAuth } from "../context/AuthContext";
import { readJson, removeItem,writeJson } from "../lib/offline/storage";
import { useReceptionTheme } from "../providers/ReceptionThemeProvider";
import {
  getFirebaseAuth,
  sendPasswordResetEmail,
} from "../services/firebaseAuth";
import { useFirebaseApp } from "../services/useFirebase";
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

// Icon components for password visibility toggle and dark mode
function EyeIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
      />
    </svg>
  );
}

function EyeSlashIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
      />
    </svg>
  );
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
      />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
      />
    </svg>
  );
}

interface LoginProps {
  onLoginSuccess?: () => void;
}

function Login({ onLoginSuccess }: LoginProps) {
  const { login, status } = useAuth();
  const { toggleDark, dark } = useReceptionTheme();
  const app = useFirebaseApp();
  const auth = useMemo(() => getFirebaseAuth(app), [app]);

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetStatus, setResetStatus] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");
  const [resetError, setResetError] = useState<string | null>(null);

  // Device PIN state
  const [devicePin, setDevicePin] = useState<DevicePin | null>(null);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [showPinUnlock, setShowPinUnlock] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);

  const emailRef = useRef<HTMLInputElement>(null);
  const pinRef = useRef<HTMLInputElement>(null);
  const resetEmailRef = useRef<HTMLInputElement>(null);

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
    if (showForgotPassword) {
      resetEmailRef.current?.focus();
    } else if (showPinUnlock) {
      pinRef.current?.focus();
    } else {
      emailRef.current?.focus();
    }
  }, [showPinUnlock, showForgotPassword]);

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

  const handleForgotPassword = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setResetStatus("sending");
      setResetError(null);

      const result = await sendPasswordResetEmail(auth, resetEmail);

      if (result.success) {
        setResetStatus("sent");
      } else {
        setResetStatus("error");
        setResetError(result.error ?? "Failed to send reset email");
      }
    },
    [auth, resetEmail]
  );

  const handleBackToLogin = useCallback(() => {
    setShowForgotPassword(false);
    setResetStatus("idle");
    setResetError(null);
    setResetEmail("");
  }, []);

  const handleShowForgotPassword = useCallback(() => {
    setShowForgotPassword(true);
    setResetEmail(email); // Pre-fill with entered email
  }, [email]);

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

  // Render forgot password screen
  if (showForgotPassword) {
    return (
      <LoginContainer dark={dark} toggleDark={toggleDark}>
        <ProductLogo />
        <h1 className="mt-6 text-xl font-semibold text-foreground">
          Reset your password
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {resetStatus === "sent"
            ? "Check your email for a password reset link."
            : "Enter your email and we'll send you a reset link."}
        </p>

        {resetStatus !== "sent" ? (
          <form onSubmit={handleForgotPassword} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="reset-email"
                className="block text-sm font-medium text-foreground"
              >
                Email
              </label>
              <Input compatibilityMode="no-wrapper"
                ref={resetEmailRef}
                id="reset-email"
                type="email"
                autoComplete="email"
                required
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="name@company.com"
                className="mt-1.5 w-full rounded-lg border border-border-2 px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-none focus-visible:focus:ring-2 focus-visible:focus:ring-indigo-500"
              />
            </div>

            {resetError && (
              <p role="alert" className="text-sm font-medium text-error-main">
                {resetError}
              </p>
            )}

            <Button
              type="submit"
              disabled={resetStatus === "sending"}
              className="w-full rounded-lg bg-primary-main px-4 py-3 font-medium text-primary-fg hover:bg-indigo-700 focus:outline-none focus-visible:focus:ring-2 focus-visible:focus:ring-indigo-500 focus-visible:focus:ring-offset-2 disabled:opacity-50"
            >
              {resetStatus === "sending" ? "Sending..." : "Send reset link"}
            </Button>
          </form>
        ) : (
          <div className="mt-6">
            <div className="rounded-lg bg-success-light/20 p-4">
              <p className="text-sm text-success-main">
                If an account exists for {resetEmail}, you&apos;ll receive an email shortly.
              </p>
            </div>
          </div>
        )}

        <Button
          type="button"
          onClick={handleBackToLogin}
          className="mt-4 w-full text-center text-sm font-medium text-primary-main hover:text-indigo-500"
        >
          Back to sign in
        </Button>

      </LoginContainer>
    );
  }

  // Render PIN setup screen
  if (showPinSetup) {
    return (
      <LoginContainer dark={dark} toggleDark={toggleDark}>
        <ProductLogo />
        <h1 className="mt-6 text-xl font-semibold text-foreground">
          Set up quick unlock
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Create a 6-digit PIN for faster access on this device.
        </p>

        <div className="mt-6">
          <label htmlFor="pin-setup" className="sr-only">
            Enter 6-digit PIN
          </label>
          <Input compatibilityMode="no-wrapper"
            ref={pinRef}
            id="pin-setup"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            maxLength={PIN_LENGTH}
            value={pinInput}
            onChange={(e) => handlePinInputChange(e.target.value)}
            placeholder="Enter 6-digit PIN"
            className="w-full rounded-lg border border-border-2 px-4 py-3 text-center text-2xl tracking-widest text-foreground placeholder:text-base placeholder:tracking-normal focus:border-indigo-500 focus:outline-none focus-visible:focus:ring-2 focus-visible:focus:ring-indigo-500"
          />
        </div>

        <Button
          type="button"
          onClick={handleSkipPinSetup}
          className="mt-4 w-full rounded-lg border border-border-2 px-4 py-3 text-sm font-medium text-foreground hover:bg-surface-2 focus:outline-none focus-visible:focus:ring-2 focus-visible:focus:ring-indigo-500 focus-visible:focus:ring-offset-2"
        >
          Skip for now
        </Button>

      </LoginContainer>
    );
  }

  // Render PIN unlock screen
  if (showPinUnlock && devicePin) {
    const pinErrorId = "pin-error";
    return (
      <LoginContainer dark={dark} toggleDark={toggleDark}>
        <ProductLogo />
        <h1 className="mt-6 text-xl font-semibold text-foreground">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter your device PIN to unlock.
        </p>

        <div className="mt-6">
          <label htmlFor="pin-unlock" className="sr-only">
            Enter PIN
          </label>
          <Input compatibilityMode="no-wrapper"
            ref={pinRef}
            id="pin-unlock"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            maxLength={PIN_LENGTH}
            value={pinInput}
            onChange={(e) => handlePinInputChange(e.target.value)}
            placeholder="Enter PIN"
            aria-describedby={pinError ? pinErrorId : undefined}
            className="w-full rounded-lg border border-border-2 px-4 py-3 text-center text-2xl tracking-widest text-foreground placeholder:text-base placeholder:tracking-normal focus:border-indigo-500 focus:outline-none focus-visible:focus:ring-2 focus-visible:focus:ring-indigo-500"
          />
        </div>

        {pinError && (
          <p
            id={pinErrorId}
            role="alert"
            className="mt-2 text-sm font-medium text-error-main"
          >
            {pinError}
          </p>
        )}

        <Button
          type="button"
          onClick={handleClearDevicePin}
          className="mt-4 w-full rounded-lg border border-border-2 px-4 py-3 text-sm font-medium text-foreground hover:bg-surface-2 focus:outline-none focus-visible:focus:ring-2 focus-visible:focus:ring-indigo-500 focus-visible:focus:ring-offset-2"
        >
          Sign in with email instead
        </Button>

      </LoginContainer>
    );
  }

  // Render email/password login
  const loginErrorId = "login-error";
  return (
    <LoginContainer dark={dark} toggleDark={toggleDark}>
      <ProductLogo />
      <h1 className="mt-6 text-xl font-semibold text-foreground">
        Sign in to Reception
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Enter your credentials to continue.
      </p>

      <form onSubmit={handleEmailLogin} className="mt-6 space-y-5">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-foreground"
          >
            Email
          </label>
          <Input compatibilityMode="no-wrapper"
            ref={emailRef}
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            aria-describedby={error ? loginErrorId : undefined}
            className="mt-1.5 w-full rounded-lg border border-border-2 px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-none focus-visible:focus:ring-2 focus-visible:focus:ring-indigo-500"
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-foreground"
            >
              Password
            </label>
            <Button
              type="button"
              onClick={handleShowForgotPassword}
              className="text-sm font-medium text-primary-main hover:text-indigo-500"
            >
              Forgot password?
            </Button>
          </div>
          <div className="relative mt-1.5">
            <Input compatibilityMode="no-wrapper"
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-describedby={error ? loginErrorId : undefined}
              className="w-full rounded-lg border border-border-2 px-4 py-2.5 pr-10 text-foreground focus:border-indigo-500 focus:outline-none focus-visible:focus:ring-2 focus-visible:focus:ring-indigo-500"
            />
            <Button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground focus:outline-none focus-visible:focus:ring-2 focus-visible:focus:ring-indigo-500 focus-visible:focus:ring-offset-2"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeSlashIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {error && (
          <p
            id={loginErrorId}
            role="alert"
            className="text-sm font-medium text-error-main"
          >
            {error}
          </p>
        )}

        <Button
          type="submit"
          disabled={isSubmitting || status === "loading"}
          className="w-full rounded-lg bg-primary-main px-4 py-3 font-medium text-primary-fg hover:bg-indigo-700 focus:outline-none focus-visible:focus:ring-2 focus-visible:focus:ring-indigo-500 focus-visible:focus:ring-offset-2 disabled:opacity-50"
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </Button>
      </form>

    </LoginContainer>
  );
}

function ProductLogo() {
  return (
    <div className="flex items-center justify-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-main">
        <span className="text-lg font-bold text-primary-fg">R</span>
      </div>
      <span className="ms-3 text-xl font-semibold text-foreground">
        Reception
      </span>
    </div>
  );
}


interface LoginContainerProps {
  children: React.ReactNode;
  dark: boolean;
  toggleDark: () => void;
}

function LoginContainer({ children, dark, toggleDark }: LoginContainerProps) {
  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-gradient-to-br from-surface-2 via-surface-2 to-surface-3 px-4">
      <div className="relative w-full max-w-md rounded-2xl bg-surface px-8 py-10 shadow-xl">
        <Button
          type="button"
          onClick={toggleDark}
          aria-pressed={dark}
          aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
          className="absolute right-4 top-4 rounded-lg p-2 text-muted-foreground hover:bg-surface-2 hover:text-muted-foreground focus:outline-none focus-visible:focus:ring-2 focus-visible:focus:ring-indigo-500 focus-visible:focus:ring-offset-2"
        >
          {dark ? (
            <SunIcon className="h-5 w-5" />
          ) : (
            <MoonIcon className="h-5 w-5" />
          )}
        </Button>

        {children}
      </div>
    </div>
  );
}

export default memo(Login);
