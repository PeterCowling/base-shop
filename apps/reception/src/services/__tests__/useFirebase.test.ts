// src/services/__tests__/useFirebase.test.ts
/* eslint-env vitest */
import { renderHook } from "@testing-library/react";
import type { FirebaseApp } from "firebase/app";
import { afterEach, describe, expect, it, vi } from "vitest";

/* ------------------------------------------------------------------ */
/*  Hoist‑safe holders (declare with `var`, no assignment here)        */
/* ------------------------------------------------------------------ */
/* eslint-disable no-var */
var initializeAppMock: ReturnType<typeof vi.fn>;
var getAppsMock: ReturnType<typeof vi.fn>;
var getAppMock: ReturnType<typeof vi.fn>;
var getDatabaseMock: ReturnType<typeof vi.fn>;
var getFirestoreMock: ReturnType<typeof vi.fn>;
/* eslint-enable  no-var */

const fakeApp = { name: "mock-app" } as unknown as FirebaseApp;

/* ------------------------------------------------------------------ */
/*  Register mocks (assign inside factory)                             */
/* ------------------------------------------------------------------ */
vi.mock("firebase/app", () => {
  initializeAppMock = vi.fn(() => fakeApp);
  getAppsMock = vi.fn(() => []);
  getAppMock = vi.fn(() => fakeApp);

  return {
    initializeApp: initializeAppMock,
    getApps: getAppsMock,
    getApp: getAppMock,
  };
});

vi.mock("firebase/database", () => {
  getDatabaseMock = vi.fn(() => ({ db: true }));
  return { getDatabase: getDatabaseMock };
});

vi.mock("firebase/firestore", () => {
  getFirestoreMock = vi.fn(() => ({ fs: true }));
  return { getFirestore: getFirestoreMock };
});

/* ------------------------------------------------------------------ */
/*  Import hooks AFTER mocks are in place                              */
/* ------------------------------------------------------------------ */
import {
  useFirebaseApp,
  useFirebaseConfig,
  useFirebaseDatabase,
  useFirebaseFirestore,
} from "../useFirebase";

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */
describe("useFirebase hooks", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("useFirebaseConfig returns values from import.meta.env", () => {
    import.meta.env.VITE_FIREBASE_API_KEY = "key";
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN = "domain";
    import.meta.env.VITE_FIREBASE_PROJECT_ID = "pid";
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET = "bucket";
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID = "sender";
    import.meta.env.VITE_FIREBASE_APP_ID = "appid";
    import.meta.env.VITE_FIREBASE_DATABASE_URL = "url";
    import.meta.env.VITE_FIREBASE_MEASUREMENT_ID = "measure";

    const { result } = renderHook(() => useFirebaseConfig());

    expect(result.current).toEqual({
      apiKey: "key",
      authDomain: "domain",
      projectId: "pid",
      storageBucket: "bucket",
      messagingSenderId: "sender",
      appId: "appid",
      databaseURL: "url",
      measurementId: "measure",
    });
  });

  it("throws when env vars are missing or empty", () => {
    import.meta.env.VITE_FIREBASE_API_KEY = "";
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN = "d";
    import.meta.env.VITE_FIREBASE_PROJECT_ID = "p";
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET = "b";
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID = "s";
    import.meta.env.VITE_FIREBASE_APP_ID = "a";
    import.meta.env.VITE_FIREBASE_DATABASE_URL = "u";
    import.meta.env.VITE_FIREBASE_MEASUREMENT_ID = "m";

    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    try {
      expect(() => renderHook(() => useFirebaseConfig())).toThrow(
        /VITE_FIREBASE_API_KEY/
      );
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });

  it("useFirebaseApp initializes once and reuses existing app", () => {
    import.meta.env.VITE_FIREBASE_API_KEY = "k";
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN = "d";
    import.meta.env.VITE_FIREBASE_PROJECT_ID = "p";
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET = "b";
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID = "s";
    import.meta.env.VITE_FIREBASE_APP_ID = "a";
    import.meta.env.VITE_FIREBASE_DATABASE_URL = "u";
    import.meta.env.VITE_FIREBASE_MEASUREMENT_ID = "m";

    // First call ⇒ initializeApp runs
    getAppsMock.mockReturnValueOnce([]).mockReturnValue([fakeApp]);

    const first = renderHook(() => useFirebaseApp());
    expect(first.result.current).toBe(fakeApp);
    expect(initializeAppMock).toHaveBeenCalledTimes(1);

    // Second call ⇒ getApp path
    const second = renderHook(() => useFirebaseApp());
    expect(second.result.current).toBe(fakeApp);
    expect(initializeAppMock).toHaveBeenCalledTimes(1);
    expect(getAppMock).toHaveBeenCalled();
  });

  it("useFirebaseDatabase and useFirebaseFirestore return db/fs objects", () => {
    getAppsMock.mockReturnValue([fakeApp]);

    const { result: db } = renderHook(() => useFirebaseDatabase());
    expect(getDatabaseMock).toHaveBeenCalledWith(fakeApp);
    expect(db.current).toEqual({ db: true });

    const { result: fs } = renderHook(() => useFirebaseFirestore());
    expect(getFirestoreMock).toHaveBeenCalledWith(fakeApp);
    expect(fs.current).toEqual({ fs: true });
  });
});
