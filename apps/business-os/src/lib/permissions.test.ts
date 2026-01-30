/**
 * Permissions Tests
 * MVP-B2: Server-side authorization on all mutations
 */

import type { User } from "./current-user";
import {
  canCreateCard,
  canCreateIdea,
  canEditCard,
  canEditIdea,
} from "./permissions";

describe("permissions", () => {
  const adminUser: User = {
    id: "pete",
    name: "Pete",
    email: "pete@business-os.local",
    role: "admin",
  };

  const regularUser: User = {
    id: "avery",
    name: "Avery",
    email: "avery@business-os.local",
    role: "user",
  };

  const otherUser: User = {
    id: "cristiana",
    name: "Cristiana",
    email: "cristiana@business-os.local",
    role: "admin",
  };

  describe("canCreateIdea", () => {
    it("should return true for authenticated users", () => {
      expect(canCreateIdea(adminUser)).toBe(true);
      expect(canCreateIdea(regularUser)).toBe(true);
    });
  });

  describe("canCreateCard", () => {
    it("should return true for authenticated users", () => {
      expect(canCreateCard(adminUser)).toBe(true);
      expect(canCreateCard(regularUser)).toBe(true);
    });
  });

  describe("canEditCard", () => {
    const ownedCard = {
      ID: "BRIK-001",
      Owner: "Pete",
      Lane: "Inbox" as const,
    };

    const othersCard = {
      ID: "BRIK-002",
      Owner: "Avery",
      Lane: "Inbox" as const,
    };

    it("should allow admin to edit any card", () => {
      expect(canEditCard(adminUser, ownedCard)).toBe(true);
      expect(canEditCard(adminUser, othersCard)).toBe(true);
      expect(canEditCard(otherUser, ownedCard)).toBe(true);
    });

    it("should allow user to edit their own card", () => {
      expect(canEditCard(regularUser, othersCard)).toBe(true);
    });

    it("should not allow user to edit others' card", () => {
      expect(canEditCard(regularUser, ownedCard)).toBe(false);
    });

    it("should handle card without owner", () => {
      const noOwner = { ID: "BRIK-003", Lane: "Inbox" as const };
      // Admins can edit cards without owners
      expect(canEditCard(adminUser, noOwner)).toBe(true);
      // Regular users cannot
      expect(canEditCard(regularUser, noOwner)).toBe(false);
    });
  });

  describe("canEditIdea", () => {
    const ownedIdea = {
      ID: "BRIK-OPP-001",
      Owner: "Pete",
    };

    const othersIdea = {
      ID: "BRIK-OPP-002",
      Owner: "Avery",
    };

    it("should allow admin to edit any idea", () => {
      expect(canEditIdea(adminUser, ownedIdea)).toBe(true);
      expect(canEditIdea(adminUser, othersIdea)).toBe(true);
      expect(canEditIdea(otherUser, ownedIdea)).toBe(true);
    });

    it("should allow user to edit their own idea", () => {
      expect(canEditIdea(regularUser, othersIdea)).toBe(true);
    });

    it("should not allow user to edit others' idea", () => {
      expect(canEditIdea(regularUser, ownedIdea)).toBe(false);
    });

    it("should handle idea without owner", () => {
      const noOwner = { ID: "BRIK-OPP-003" };
      // Admins can edit ideas without owners
      expect(canEditIdea(adminUser, noOwner)).toBe(true);
      // Regular users cannot
      expect(canEditIdea(regularUser, noOwner)).toBe(false);
    });
  });
});
