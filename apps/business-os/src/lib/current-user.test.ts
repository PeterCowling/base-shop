/**
 * Current User Tests
 */

import {
  ADMIN_USERS,
  canViewAllArchived,
  getCurrentUser,
  USERS,
} from "./current-user";

describe("current-user", () => {
  const originalEnv = process.env.CURRENT_USER_ID;

  afterEach(() => {
    // Restore original env
    if (originalEnv) {
      process.env.CURRENT_USER_ID = originalEnv;
    } else {
      delete process.env.CURRENT_USER_ID;
    }
  });

  describe("getCurrentUser", () => {
    it("returns Pete by default", () => {
      delete process.env.CURRENT_USER_ID;
      const user = getCurrentUser();

      expect(user.id).toBe("pete");
      expect(user.name).toBe("Pete");
      expect(user.role).toBe("admin");
    });

    it("returns user from environment variable", () => {
      process.env.CURRENT_USER_ID = "cristiana";
      const user = getCurrentUser();

      expect(user.id).toBe("cristiana");
      expect(user.name).toBe("Cristiana");
      expect(user.role).toBe("admin");
    });

    it("falls back to Pete for unknown user", () => {
      process.env.CURRENT_USER_ID = "unknown";
      const user = getCurrentUser();

      expect(user.id).toBe("pete");
    });
  });

  describe("canViewAllArchived", () => {
    it("returns true for Pete", () => {
      expect(canViewAllArchived(USERS.pete)).toBe(true);
    });

    it("returns true for Cristiana", () => {
      expect(canViewAllArchived(USERS.cristiana)).toBe(true);
    });

    it("returns false for non-admin users", () => {
      expect(canViewAllArchived(USERS.avery)).toBe(false);
    });
  });

  describe("ADMIN_USERS", () => {
    it("includes Pete and Cristiana", () => {
      expect(ADMIN_USERS).toContain("pete");
      expect(ADMIN_USERS).toContain("cristiana");
    });

    it("does not include other users", () => {
      expect(ADMIN_USERS).not.toContain("avery");
    });
  });

  describe("USERS", () => {
    it("defines Pete", () => {
      expect(USERS.pete).toBeDefined();
      expect(USERS.pete.name).toBe("Pete");
      expect(USERS.pete.email).toBe("pete@business-os.local");
    });

    it("defines Cristiana", () => {
      expect(USERS.cristiana).toBeDefined();
      expect(USERS.cristiana.name).toBe("Cristiana");
      expect(USERS.cristiana.email).toBe("cristiana@business-os.local");
    });

    it("defines Avery", () => {
      expect(USERS.avery).toBeDefined();
      expect(USERS.avery.name).toBe("Avery");
      expect(USERS.avery.role).toBe("user");
    });
  });

  describe("canEditCard", () => {
    const mockCard = {
      ID: "TEST-001",
      Lane: "In progress" as const,
      Owner: "Avery",
      Priority: "P1" as const,
      Title: "Test Card",
      content: "Test content",
      filePath: "docs/business-os/cards/TEST-001.user.md",
    };

    it("returns true when user is card owner", () => {
      const { canEditCard } = require("./current-user");
      expect(canEditCard(USERS.avery, mockCard)).toBe(true);
    });

    it("returns true when user is admin (Pete)", () => {
      const { canEditCard } = require("./current-user");
      expect(canEditCard(USERS.pete, mockCard)).toBe(true);
    });

    it("returns true when user is admin (Cristiana)", () => {
      const { canEditCard } = require("./current-user");
      expect(canEditCard(USERS.cristiana, mockCard)).toBe(true);
    });

    it("returns false when user is not owner and not admin", () => {
      const { canEditCard } = require("./current-user");
      const cardOwnedByPete = { ...mockCard, Owner: "Pete" };
      expect(canEditCard(USERS.avery, cardOwnedByPete)).toBe(false);
    });

    it("returns true when card has no owner and user is admin", () => {
      const { canEditCard } = require("./current-user");
      const cardWithNoOwner = { ...mockCard, Owner: undefined };
      expect(canEditCard(USERS.pete, cardWithNoOwner)).toBe(true);
    });

    it("returns false when card has no owner and user is not admin", () => {
      const { canEditCard } = require("./current-user");
      const cardWithNoOwner = { ...mockCard, Owner: undefined };
      expect(canEditCard(USERS.avery, cardWithNoOwner)).toBe(false);
    });
  });
});
