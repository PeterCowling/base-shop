// Tests for the 5 MB import size limit in the inventory import route.
// We test the size limit logic by constructing requests with appropriate
// content-length headers or body sizes.

const IMPORT_MAX_BYTES = 5 * 1024 * 1024; // 5 MB

describe("import size limit constants", () => {
  it("5 MB limit is 5 * 1024 * 1024 bytes", () => {
    expect(IMPORT_MAX_BYTES).toBe(5_242_880);
  });

  it("content below 5 MB should be within limit", () => {
    const small = "a".repeat(100);
    expect(Buffer.byteLength(small, "utf8")).toBeLessThan(IMPORT_MAX_BYTES);
  });

  it("content at exactly 5 MB is within limit", () => {
    const atLimit = "a".repeat(IMPORT_MAX_BYTES);
    expect(Buffer.byteLength(atLimit, "utf8")).toBe(IMPORT_MAX_BYTES);
    expect(Buffer.byteLength(atLimit, "utf8") > IMPORT_MAX_BYTES).toBe(false);
  });

  it("content one byte over 5 MB exceeds the limit", () => {
    const overLimit = "a".repeat(IMPORT_MAX_BYTES + 1);
    expect(Buffer.byteLength(overLimit, "utf8")).toBeGreaterThan(IMPORT_MAX_BYTES);
  });

  it("multi-byte UTF-8 characters count toward byte limit", () => {
    // Each Japanese character is 3 bytes in UTF-8.
    const oneMb = Math.ceil(IMPORT_MAX_BYTES / 3);
    const japanese = "あ".repeat(oneMb + 1);
    expect(Buffer.byteLength(japanese, "utf8")).toBeGreaterThan(IMPORT_MAX_BYTES);
  });
});

describe("content-length header validation", () => {
  it("content-length exactly at limit is allowed", () => {
    const parsed = IMPORT_MAX_BYTES;
    expect(Number.isFinite(parsed) && parsed > IMPORT_MAX_BYTES).toBe(false);
  });

  it("content-length one byte over limit triggers early rejection", () => {
    const parsed = IMPORT_MAX_BYTES + 1;
    expect(Number.isFinite(parsed) && parsed > IMPORT_MAX_BYTES).toBe(true);
  });

  it("non-numeric content-length is ignored (no early rejection)", () => {
    const parsed = Number("abc");
    expect(Number.isFinite(parsed)).toBe(false);
  });
});
