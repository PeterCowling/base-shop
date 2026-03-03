import type { User as FirebaseUser } from "firebase/auth";
import type { Database,DataSnapshot } from "firebase/database";

import { loadUserWithProfile } from "../firebaseAuth";

/* eslint-disable no-var */
var getMock: jest.Mock;
var refMock: jest.Mock;
var getMetaMock: jest.Mock;
var setMetaMock: jest.Mock;
/* eslint-enable no-var */

jest.mock("firebase/database", () => {
  getMock = jest.fn();
  refMock = jest.fn((_database: unknown, path: string) => path);
  return {
    get: getMock,
    ref: refMock,
  };
});

jest.mock("../../lib/offline/receptionDb", () => ({
  getMeta: (...args: unknown[]) => getMetaMock(...args),
  setMeta: (...args: unknown[]) => setMetaMock(...args),
}));

function createSnapshot(data: unknown, exists = true): DataSnapshot {
  return {
    exists: () => exists,
    val: () => data,
  } as unknown as DataSnapshot;
}

function createFirebaseUser(overrides: Partial<FirebaseUser> = {}): FirebaseUser {
  return {
    uid: "user-1",
    email: "front.desk@example.com",
    displayName: null,
    ...overrides,
  } as FirebaseUser;
}

describe("loadUserWithProfile", () => {
  const database = {} as Database;

  beforeEach(() => {
    jest.clearAllMocks();
    getMetaMock = jest.fn().mockResolvedValue(null);
    setMetaMock = jest.fn().mockResolvedValue(undefined);
  });

  it("loads profiles that omit uid/email/user_name and falls back to firebase auth identity", async () => {
    getMock.mockResolvedValue(
      createSnapshot({
        displayName: "Front Desk",
        roles: {
          manager: true,
        },
      })
    );

    const user = await loadUserWithProfile(database, createFirebaseUser());

    expect(refMock).toHaveBeenCalledWith(database, "userProfiles/user-1");
    expect(user).toEqual({
      uid: "user-1",
      email: "front.desk@example.com",
      user_name: "Front Desk",
      displayName: "Front Desk",
      roles: ["manager"],
    });
  });

  it("sanitizes user_name fallback from displayName before using it in key paths", async () => {
    getMock.mockResolvedValue(
      createSnapshot({
        displayName: "Front.Desk/Admin",
        roles: ["staff"],
      })
    );

    const user = await loadUserWithProfile(database, createFirebaseUser({ email: "desk@example.com" }));

    expect(user?.user_name).toBe("Front_Desk_Admin");
    expect(user?.roles).toEqual(["staff"]);
  });

  it("falls back to a sanitized email local-part when no names are available", async () => {
    getMock.mockResolvedValue(
      createSnapshot({
        roles: ["staff"],
      })
    );

    const user = await loadUserWithProfile(database, createFirebaseUser({ email: "first.last@example.com" }));

    expect(user?.user_name).toBe("first_last");
    expect(user?.email).toBe("first.last@example.com");
  });

  it("returns cached profile when Firebase get throws (TC-04)", async () => {
    const cachedUser = {
      uid: "user-1",
      email: "front.desk@example.com",
      user_name: "FrontDesk",
      displayName: "Front Desk",
      roles: ["staff"] as const,
    };
    getMock.mockRejectedValue(new Error("network error"));
    getMetaMock.mockResolvedValue(cachedUser);

    const user = await loadUserWithProfile(database, createFirebaseUser());

    expect(user).toEqual(cachedUser);
  });

  it("returns null when Firebase get throws and no cached profile exists (TC-05)", async () => {
    getMock.mockRejectedValue(new Error("network error"));
    getMetaMock.mockResolvedValue(null);

    const user = await loadUserWithProfile(database, createFirebaseUser());

    expect(user).toBeNull();
  });

  it("caches user profile on successful load", async () => {
    getMock.mockResolvedValue(
      createSnapshot({
        displayName: "Front Desk",
        roles: { manager: true },
      })
    );

    await loadUserWithProfile(database, createFirebaseUser());

    expect(setMetaMock).toHaveBeenCalledWith(
      "cachedUserProfile",
      expect.objectContaining({ uid: "user-1", email: "front.desk@example.com" })
    );
  });
});
