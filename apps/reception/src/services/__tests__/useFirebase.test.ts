// src/services/__tests__/useFirebase.test.ts
import "@testing-library/jest-dom";

import { renderHook } from "@testing-library/react";
import type { FirebaseApp } from "firebase/app";

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
/*  Hoist‑safe holders (declare with `var`, no assignment here)        */
/* ------------------------------------------------------------------ */
/* eslint-disable no-var */
var initializeAppMock: jest.Mock;
var getAppsMock: jest.Mock;
var getAppMock: jest.Mock;
var getDatabaseMock: jest.Mock;
var getFirestoreMock: jest.Mock;
/* eslint-enable  no-var */

const fakeApp = { name: "mock-app" } as unknown as FirebaseApp;

/* ------------------------------------------------------------------ */
/*  Register mocks (assign inside factory)                             */
/* ------------------------------------------------------------------ */
jest.mock("firebase/app", () => {
  initializeAppMock = jest.fn(() => fakeApp);
  getAppsMock = jest.fn(() => []);
  getAppMock = jest.fn(() => fakeApp);

  return {
    initializeApp: initializeAppMock,
    getApps: getAppsMock,
    getApp: getAppMock,
  };
});

jest.mock("firebase/database", () => {
  getDatabaseMock = jest.fn(() => ({ db: true }));
  return { getDatabase: getDatabaseMock };
});

jest.mock("firebase/firestore", () => {
  getFirestoreMock = jest.fn(() => ({ fs: true }));
  return { getFirestore: getFirestoreMock };
});

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */
describe("useFirebase hooks", () => {
  afterEach(() => {
    jest.restoreAllMocks();
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
