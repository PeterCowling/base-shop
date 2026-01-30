import { describe, expect, it } from "@jest/globals";

import {
  buildAuditCommitMessage,
  CommitIdentities,
  formatCoAuthor,
  getCommitIdentity,
  getGitAuthorOptions,
} from "./commit-identity";

describe("CommitIdentities", () => {
  it("should have user identity", () => {
    expect(CommitIdentities.user).toEqual({
      name: "Pete",
      email: "pete@business-os.local",
    });
  });

  it("should have agent identity", () => {
    expect(CommitIdentities.agent).toEqual({
      name: "Claude Agent",
      email: "agent@business-os.internal",
    });
  });
});

describe("getCommitIdentity", () => {
  it("should return user identity for 'user'", () => {
    const identity = getCommitIdentity("user");
    expect(identity).toEqual(CommitIdentities.user);
  });

  it("should return agent identity for 'agent'", () => {
    const identity = getCommitIdentity("agent");
    expect(identity).toEqual(CommitIdentities.agent);
  });

  it("should return custom identity when passed object", () => {
    const customIdentity = {
      name: "Test User",
      email: "test@example.com",
    };
    const identity = getCommitIdentity(customIdentity);
    expect(identity).toEqual(customIdentity);
  });
});

describe("formatCoAuthor", () => {
  it("should format user identity correctly", () => {
    const formatted = formatCoAuthor(CommitIdentities.user);
    expect(formatted).toBe("Co-Authored-By: Pete <pete@business-os.local>");
  });

  it("should format agent identity correctly", () => {
    const formatted = formatCoAuthor(CommitIdentities.agent);
    expect(formatted).toBe(
      "Co-Authored-By: Claude Agent <agent@business-os.internal>"
    );
  });

  it("should format custom identity correctly", () => {
    const customIdentity = {
      name: "Test User",
      email: "test@example.com",
    };
    const formatted = formatCoAuthor(customIdentity);
    expect(formatted).toBe("Co-Authored-By: Test User <test@example.com>");
  });
});

describe("getGitAuthorOptions", () => {
  it("should return git author option for user identity", () => {
    const options = getGitAuthorOptions(CommitIdentities.user);
    expect(options).toEqual({
      "--author": "Pete <pete@business-os.local>",
    });
  });

  it("should return git author option for agent identity", () => {
    const options = getGitAuthorOptions(CommitIdentities.agent);
    expect(options).toEqual({
      "--author": "Claude Agent <agent@business-os.internal>",
    });
  });

  it("should return git author option for custom identity", () => {
    const customIdentity = {
      name: "Test User",
      email: "test@example.com",
    };
    const options = getGitAuthorOptions(customIdentity);
    expect(options).toEqual({
      "--author": "Test User <test@example.com>",
    });
  });
});

describe("buildAuditCommitMessage", () => {
  it("should build commit message with actor, initiator, and entity", () => {
    const message = buildAuditCommitMessage({
      actor: "pete",
      initiator: "pete",
      entityId: "BRIK-ENG-0001",
      action: "Add card: Authentication flow",
    });

    expect(message).toBe(
      "Actor: pete\n" +
      "Initiator: pete\n" +
      "Entity: BRIK-ENG-0001\n" +
      "\n" +
      "Add card: Authentication flow"
    );
  });

  it("should handle agent as actor", () => {
    const message = buildAuditCommitMessage({
      actor: "agent",
      initiator: "pete",
      entityId: "BRIK-ENG-0002",
      action: "Update card: Add test coverage",
    });

    expect(message).toBe(
      "Actor: agent\n" +
      "Initiator: pete\n" +
      "Entity: BRIK-ENG-0002\n" +
      "\n" +
      "Update card: Add test coverage"
    );
  });

  it("should handle different actor and initiator", () => {
    const message = buildAuditCommitMessage({
      actor: "cristiana",
      initiator: "pete",
      entityId: "BRIK-OPP-0001",
      action: "Add idea: New feature concept",
    });

    expect(message).toBe(
      "Actor: cristiana\n" +
      "Initiator: pete\n" +
      "Entity: BRIK-OPP-0001\n" +
      "\n" +
      "Add idea: New feature concept"
    );
  });

  it("should handle multi-line action messages", () => {
    const message = buildAuditCommitMessage({
      actor: "pete",
      initiator: "pete",
      entityId: "BRIK-ENG-0003",
      action: "Update card: Implement feature\n\n- Added tests\n- Updated docs",
    });

    expect(message).toBe(
      "Actor: pete\n" +
      "Initiator: pete\n" +
      "Entity: BRIK-ENG-0003\n" +
      "\n" +
      "Update card: Implement feature\n\n- Added tests\n- Updated docs"
    );
  });
});
