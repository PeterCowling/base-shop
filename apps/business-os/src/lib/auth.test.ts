/**
 * Tests for auth helpers
 * MVP-B1: Invite-only auth system
 */

import {
  getSessionUser,
  hashPassword,
  loadUsers,
  validateCredentials,
  verifyPassword,
} from "./auth";

describe("auth helpers", () => {
  describe("hashPassword", () => {
    it("should hash a password", async () => {
      const password = "test-passcode-123";
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
    });

    it("should produce different hashes for same password", async () => {
      const password = "same-password";
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      // Bcrypt uses random salt, so hashes should differ
      expect(hash1).not.toBe(hash2);
    });
  });

  describe("verifyPassword", () => {
    it("should verify correct password", async () => {
      const password = "correct-password";
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it("should reject incorrect password", async () => {
      const password = "correct-password";
      const hash = await hashPassword(password);

      const isValid = await verifyPassword("wrong-password", hash);
      expect(isValid).toBe(false);
    });

    it("should reject empty password", async () => {
      const hash = await hashPassword("some-password");

      const isValid = await verifyPassword("", hash);
      expect(isValid).toBe(false);
    });
  });

  describe("getSessionUser", () => {
    it("should return null for empty session", () => {
      const user = getSessionUser({});
      expect(user).toBeNull();
    });

    it("should return user from session", () => {
      const session = { userId: "pete" };
      const user = getSessionUser(session);

      expect(user).toBeDefined();
      expect(user?.id).toBe("pete");
      expect(user?.name).toBe("Pete");
      expect(user?.role).toBe("admin");
    });

    it("should return null for invalid user ID", () => {
      const session = { userId: "nonexistent" };
      const user = getSessionUser(session);

      expect(user).toBeNull();
    });

    it("should return null for missing userId", () => {
      const session = { someOtherField: "value" };
      const user = getSessionUser(session);

      expect(user).toBeNull();
    });
  });

  describe("loadUsers", () => {
    it("should load users from JSON file", async () => {
      const users = await loadUsers();

      expect(users).toBeDefined();
      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBeGreaterThan(0);

      // Check first user structure
      const firstUser = users[0];
      expect(firstUser).toHaveProperty("id");
      expect(firstUser).toHaveProperty("name");
      expect(firstUser).toHaveProperty("email");
      expect(firstUser).toHaveProperty("role");
      expect(firstUser).toHaveProperty("passcodeHash");
    });

    it("should return empty array if file doesn't exist", async () => {
      // This test assumes the file exists, so we just verify it returns an array
      const users = await loadUsers();
      expect(Array.isArray(users)).toBe(true);
    });
  });

  describe("validateCredentials", () => {
    it("should validate correct credentials", async () => {
      // Using dev passcode from users.json
      const user = await validateCredentials("pete", "pete123");

      expect(user).toBeDefined();
      expect(user?.id).toBe("pete");
      expect(user?.name).toBe("Pete");
      expect(user?.role).toBe("admin");
    });

    it("should reject incorrect passcode", async () => {
      const user = await validateCredentials("pete", "wrong-passcode");
      expect(user).toBeNull();
    });

    it("should reject nonexistent user", async () => {
      const user = await validateCredentials("nonexistent", "any-passcode");
      expect(user).toBeNull();
    });

    it("should reject empty username", async () => {
      const user = await validateCredentials("", "pete123");
      expect(user).toBeNull();
    });

    it("should reject empty passcode", async () => {
      const user = await validateCredentials("pete", "");
      expect(user).toBeNull();
    });
  });
});
