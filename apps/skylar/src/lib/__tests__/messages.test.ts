// apps/skylar/src/lib/__tests__/messages.test.ts
import en from "../../../i18n/en.json";
import zh from "../../../i18n/zh.json";
import { DEFAULT_LOCALE } from "../locales";
import {
  createTranslator,
  getMessages,
  getTranslatorForLocale,
} from "../messages";

const enMessages = en as Record<string, string>;
const zhMessages = zh as Record<string, string>;

describe("createTranslator", () => {
  it("returns the matching message", () => {
    const translator = createTranslator({ greeting: "Hello" });
    expect(translator("greeting")).toBe("Hello");
  });

  it("performs template substitution", () => {
    const translator = createTranslator({ welcome: "Hi {name}" });
    expect(translator("welcome", { name: "Skylar" })).toBe("Hi Skylar");
  });

  it("leaves placeholders untouched when vars are missing", () => {
    const translator = createTranslator({ welcome: "Hi {name}" });
    expect(translator("welcome", { city: "Milan" })).toBe("Hi {name}");
  });

  it("falls back to the key when the message is missing", () => {
    const translator = createTranslator({});
    expect(translator("unknown.key")).toBe("unknown.key");
  });
});

describe("getMessages", () => {
  it("returns the correct map for the default locale", () => {
    expect(getMessages(DEFAULT_LOCALE)).toBe(enMessages);
  });
});

describe("getTranslatorForLocale", () => {
  it("uses the first entry from an array of locale values", () => {
    const translator = getTranslatorForLocale(["zh", "en"]);
    expect(translator("footer.copy")).toBe(zhMessages["footer.copy"]);
  });

  it("falls back to the default locale when the input is invalid", () => {
    const translator = getTranslatorForLocale("jp");
    expect(translator("footer.copy")).toBe(enMessages["footer.copy"]);
  });
});
