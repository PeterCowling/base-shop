import "@testing-library/jest-dom";

import { act, renderHook } from "@testing-library/react";
import * as firebaseDatabase from "firebase/database";

import useFirebaseSubscription from "../../hooks/data/useFirebaseSubscription";
import {
  FirebaseSubscriptionCacheProvider,
  useFirebaseSubscriptionCache,
} from "../FirebaseSubscriptionCache";

interface SnapshotMock {
  exists: () => boolean;
  val: () => unknown;
}

interface Listener {
  cb: (snap: SnapshotMock) => void;
  errCb?: (err: unknown) => void;
}

interface FirebaseDatabaseMock {
  ref: (db: unknown, path: string) => { path: string };
  onValue: (
    dbRef: { path: string },
    cb: Listener["cb"],
    errCb?: Listener["errCb"]
  ) => void;
  off: (dbRef: { path: string }) => void;
  __listeners: Map<string, Listener>;
}

const firebaseDb = firebaseDatabase as unknown as FirebaseDatabaseMock;
const { off, onValue, ref } = firebaseDb;

beforeEach(() => {
  jest.clearAllMocks();
  firebaseDb.__listeners.clear();
});

// Mock the Firebase database hook to return a stable dummy database.
// Returning a new object on every call would cause React hooks relying on
// this value to re-subscribe on each render, triggering multiple calls to
// `off` in cleanup. Using a constant ensures effect dependencies remain
// stable across renders.
const mockDatabase = {};
jest.mock("../../services/useFirebase", () => ({
  useFirebaseDatabase: () => mockDatabase,
}));

// Mock firebase/database functions
jest.mock("firebase/database", () => {
  const listeners = new Map<string, Listener>();

  return {
    ref: jest.fn((db: unknown, path: string) => ({ path })),
    onValue: jest.fn(
      (
        dbRef: { path: string },
        cb: Listener["cb"],
        errCb?: Listener["errCb"]
      ) => {
        listeners.set(dbRef.path, { cb, errCb });
      }
    ),
    off: jest.fn((dbRef: { path: string }) => {
      listeners.delete(dbRef.path);
    }),
    __listeners: listeners,
  };
});

const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <FirebaseSubscriptionCacheProvider>
    {children}
  </FirebaseSubscriptionCacheProvider>
);

describe("FirebaseSubscriptionCache", () => {
  it("subscribing to a path triggers onValue and stores data", () => {
    const { result, rerender } = renderHook(
      () => useFirebaseSubscriptionCache(),
      { wrapper }
    );

    act(() => {
      result.current.subscribe("test/path");
    });

    expect(onValue).toHaveBeenCalledTimes(1);
    expect(ref).toHaveBeenCalledWith({}, "test/path");

    const listener = firebaseDb.__listeners.get("test/path");
    expect(listener).toBeDefined();
    if (!listener) throw new Error("listener not found");
    act(() => {
      listener.cb({ exists: () => true, val: () => "value" });
    });

    rerender();

    const entry = result.current.getEntry("test/path");
    expect(entry.data).toBe("value");
    expect(entry.loading).toBe(false);
  });

  it("unsubscribing removes listeners and cache entries", () => {
    const { result, rerender } = renderHook(
      () => useFirebaseSubscriptionCache(),
      { wrapper }
    );

    act(() => {
      result.current.subscribe("to/remove");
    });

    act(() => {
      result.current.unsubscribe("to/remove");
    });

    expect(off).toHaveBeenCalledTimes(1);
    expect(firebaseDb.__listeners.has("to/remove")).toBe(false);

    rerender();
    const entry = result.current.getEntry("to/remove");
    expect(entry.data).toBeNull();
    expect(entry.loading).toBe(true);
  });

  it("useFirebaseSubscription exposes cache state", () => {
    const { result, rerender, unmount } = renderHook(
      () => useFirebaseSubscription<string>("hook/path"),
      { wrapper }
    );

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(onValue).toHaveBeenCalledTimes(1);

    const hookListener = firebaseDb.__listeners.get("hook/path");
    expect(hookListener).toBeDefined();
    if (!hookListener) throw new Error("listener not found");
    act(() => {
      const { cb } = hookListener;
      cb({ exists: () => true, val: () => "abc" });
    });
    rerender();
    expect(result.current.data).toBe("abc");
    expect(result.current.loading).toBe(false);

    const hookListenerError = firebaseDb.__listeners.get("hook/path");
    expect(hookListenerError).toBeDefined();
    if (!hookListenerError) throw new Error("listener not found");
    act(() => {
      const { errCb } = hookListenerError;
      if (errCb) errCb("err");
    });
    rerender();
    expect(result.current.error).toBe("err");

    unmount();
    expect(off).toHaveBeenCalledTimes(1);
  });
});
