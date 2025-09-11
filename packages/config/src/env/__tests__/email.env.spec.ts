import { afterEach, describe, expect, it } from "@jest/globals";

const ORIGINAL_ENV = { ...process.env };
const loadEnv = async () => (await import("../email.ts")).emailEnv;

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  jest.resetModules();
});

describe("email from and sender name", () => {
  it.each([
    ["missing", undefined, "Required"],
    ["empty", "", "Invalid email"],
  ])("requires EMAIL_FROM when %s", async (_label, value, msg) => {
    if (value === undefined) delete process.env.EMAIL_FROM;
    else process.env.EMAIL_FROM = value;
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(loadEnv()).rejects.toThrow("Invalid email environment variables");
    const err = spy.mock.calls[0][1];
    expect(err.EMAIL_FROM._errors).toContain(msg);
    spy.mockRestore();
  });

  it.each([
    [undefined, undefined],
    ["Sender", "Sender"],
    ["  Sender  ", "  Sender  "],
  ])("preserves EMAIL_SENDER_NAME %p", async (input, expected) => {
    process.env.EMAIL_FROM = "sender@example.com";
    if (input !== undefined) process.env.EMAIL_SENDER_NAME = input;
    const env = await loadEnv();
    expect(env.EMAIL_SENDER_NAME).toBe(expected);
  });
});
