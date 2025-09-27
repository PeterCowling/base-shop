import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import * as configurator from "../src/configurator";
 

const { readEnvFile, validateEnvFile, validateShopEnv } = configurator;

describe("readEnvFile", () => {
  it("ignores comments and empty values", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "env-"));
    const envPath = path.join(tmpDir, ".env");
    fs.writeFileSync(
      envPath,
      [
        "FOO=bar",
        "# this is a comment",
        "EMPTY=",
        "BAR=baz",
        "",
      ].join("\n"),
    );

    expect(readEnvFile(envPath)).toEqual({ FOO: "bar", BAR: "baz" });

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});

describe("validateEnvFile", () => {
  it("throws for missing files", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "env-"));
    const missing = path.join(tmpDir, "missing.env");
    expect(() => validateEnvFile(missing)).toThrow(`Missing ${missing}`);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("throws for invalid entries", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "env-"));
    const envPath = path.join(tmpDir, ".env");
    fs.writeFileSync(envPath, "FOO=bar");

    jest
      .spyOn(configurator, "readEnvFile")
      .mockReturnValue({ FOO: 1 } as any);

    expect(() => validateEnvFile(envPath)).toThrow();

    jest.restoreAllMocks();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("falls back to local reader when export is missing", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "env-"));
    const envPath = path.join(tmpDir, ".env");
    fs.writeFileSync(envPath, "FOO=bar\n");

    const original = (configurator as any).readEnvFile;
    // Remove exported reader to exercise fallback branch
    delete (configurator as any).readEnvFile;

    try {
      expect(() => validateEnvFile(envPath)).not.toThrow();
    } finally {
      (configurator as any).readEnvFile = original;
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});

describe("validateShopEnv", () => {
  const shop = "my-shop";

  it("throws when required plugin variables are missing", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "shop-"));
    const envDir = path.join(root, "apps", shop);
    fs.mkdirSync(envDir, { recursive: true });
    fs.writeFileSync(
      path.join(envDir, ".env"),
      "STRIPE_SECRET_KEY=sk_test\n",
    );

    const cfgDir = path.join(root, "data", "shops", shop);
    fs.mkdirSync(cfgDir, { recursive: true });
    fs.writeFileSync(
      path.join(cfgDir, "shop.json"),
      JSON.stringify({ paymentProviders: ["stripe"] }),
    );

    const cwd = process.cwd();
    process.chdir(root);
    try {
      expect(() => validateShopEnv(shop)).toThrow(
        "Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
      );
    } finally {
      process.chdir(cwd);
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it("passes when all required plugin variables are present", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "shop-"));
    const envDir = path.join(root, "apps", shop);
    fs.mkdirSync(envDir, { recursive: true });
    fs.writeFileSync(
      path.join(envDir, ".env"),
      [
        "STRIPE_SECRET_KEY=sk_test",
        "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test",
        "STRIPE_WEBHOOK_SECRET=whsec",
      ].join("\n"),
    );

    const cfgDir = path.join(root, "data", "shops", shop);
    fs.mkdirSync(cfgDir, { recursive: true });
    fs.writeFileSync(
      path.join(cfgDir, "shop.json"),
      JSON.stringify({ paymentProviders: ["stripe"] }),
    );

    const cwd = process.cwd();
    process.chdir(root);
    try {
      expect(() => validateShopEnv(shop)).not.toThrow();
    } finally {
      process.chdir(cwd);
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it("skips plugin validation when shop config is missing", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "shop-"));
    const envDir = path.join(root, "apps", shop);
    fs.mkdirSync(envDir, { recursive: true });
    fs.writeFileSync(path.join(envDir, ".env"), "");
    const cwd = process.cwd();
    process.chdir(root);
    try {
      expect(() => validateShopEnv(shop)).not.toThrow();
    } finally {
      process.chdir(cwd);
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it("requires sanity plugin variables when enabled", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "shop-"));
    const envDir = path.join(root, "apps", shop);
    fs.mkdirSync(envDir, { recursive: true });
    fs.writeFileSync(
      path.join(envDir, ".env"),
      ["SANITY_PROJECT_ID=pid", "SANITY_DATASET=dataset"].join("\n"),
    );
    const cfgDir = path.join(root, "data", "shops", shop);
    fs.mkdirSync(cfgDir, { recursive: true });
    fs.writeFileSync(
      path.join(cfgDir, "shop.json"),
      JSON.stringify({ sanityBlog: {} }),
    );
    const cwd = process.cwd();
    process.chdir(root);
    try {
      expect(() => validateShopEnv(shop)).toThrow("Missing SANITY_TOKEN");
    } finally {
      process.chdir(cwd);
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
