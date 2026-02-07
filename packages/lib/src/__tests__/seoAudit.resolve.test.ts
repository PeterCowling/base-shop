import { describe, expect, it } from "@jest/globals";

import { resolveChromeLaunch, resolveDesktopConfig, resolveLighthouse } from "../seoAudit";

describe("seoAudit resolution helpers", () => {
  it("resolves lighthouse functions from default export", () => {
    const fn = () => undefined as never;
    expect(resolveLighthouse({ default: fn })).toBe(fn);
  });

  it("resolves lighthouse functions from nested defaults", () => {
    const fn = () => undefined as never;
    expect(resolveLighthouse({ default: { default: fn } })).toBe(fn);
  });

  it("resolves lighthouse when module itself is a function", () => {
    const fn = function lighthouse() {
      return undefined as never;
    };
    expect(resolveLighthouse(fn)).toBe(fn);
  });

  it("returns undefined when lighthouse constructor missing", () => {
    expect(resolveLighthouse({})).toBeUndefined();
  });

  it("resolves chrome launch from multiple shapes", () => {
    const direct = () => undefined as never;
    const fromDefault = () => undefined as never;
    const fromNested = () => undefined as never;
    expect(resolveChromeLaunch({ launch: direct })).toBe(direct);
    expect(resolveChromeLaunch({ default: { launch: fromDefault } })).toBe(fromDefault);
    expect(resolveChromeLaunch({ default: { default: { launch: fromNested } } })).toBe(fromNested);
    expect(resolveChromeLaunch({})).toBeUndefined();
  });

  it("prefers desktop config defaults", () => {
    const mod = { default: { extends: "lighthouse:default" } };
    expect(resolveDesktopConfig(mod)).toBe(mod.default);
    const fallback = { alt: true };
    expect(resolveDesktopConfig(fallback)).toBe(fallback);
  });
});

