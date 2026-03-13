import { decrypt, encrypt, generateEncryptionKey } from "../credentials";

// TC-03-01: round-trip
it("round-trips plaintext through encrypt → decrypt", async () => {
  const key = await generateEncryptionKey();
  const plaintext = "stripe-sk-live-xxxxxxxxxxxxxxxxxxxxxxxxxxxx";
  const ciphertext = await encrypt(plaintext, key);
  expect(await decrypt(ciphertext, key)).toBe(plaintext);
});

// TC-03-02: wrong key → decrypt throws
it("throws when decrypting with the wrong key", async () => {
  const key1 = await generateEncryptionKey();
  const key2 = await generateEncryptionKey();
  const ciphertext = await encrypt("secret", key1);
  await expect(decrypt(ciphertext, key2)).rejects.toThrow();
});

// TC-03-03: IV randomness — two encryptions of same plaintext differ
it("produces different ciphertext on every encrypt call (unique IV)", async () => {
  const key = await generateEncryptionKey();
  const ct1 = await encrypt("same-value", key);
  const ct2 = await encrypt("same-value", key);
  expect(ct1).not.toBe(ct2);
});

// Edge case: empty string round-trips
it("round-trips empty string", async () => {
  const key = await generateEncryptionKey();
  expect(await decrypt(await encrypt("", key), key)).toBe("");
});

// Edge case: special characters round-trip
it("round-trips string with special characters", async () => {
  const key = await generateEncryptionKey();
  const special = "🔑 key=value&other=çáé\nwith\ttabs";
  expect(await decrypt(await encrypt(special, key), key)).toBe(special);
});

// Edge case: importKeyFromBase64 works with a 44-char base64 string (32 bytes)
it("accepts a 44-char base64 key string (simulating Worker secret)", async () => {
  const rawBytes = new Uint8Array(32);
  crypto.getRandomValues(rawBytes);
  const base64Key = Buffer.from(rawBytes).toString("base64");
  expect(base64Key).toHaveLength(44); // exactly 44 chars for 32 bytes in base64

  const ciphertext = await encrypt("test-credential", base64Key);
  expect(await decrypt(ciphertext, base64Key)).toBe("test-credential");
});

// importKeyFromBase64 rejects a key that is too short (not 32 bytes)
it("throws when key is too short (less than 32 bytes decoded)", async () => {
  const shortKey = Buffer.from(new Uint8Array(16)).toString("base64"); // only 16 bytes
  await expect(encrypt("test", shortKey)).rejects.toThrow(/32/);
});
