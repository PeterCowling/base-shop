/**
 * @jest-environment jsdom
 */
import { genSecret } from "../genSecret";
import { getCsrfToken } from "../getCsrfToken";

describe("security utils", () => {
  describe("genSecret", () => {
    const originalCrypto = globalThis.crypto;

    afterEach(() => {
      Object.defineProperty(globalThis, "crypto", { value: originalCrypto });
    });

    it("returns hex string of requested length using crypto data", () => {
      const mock = {
        getRandomValues: (arr: Uint8Array) => {
          arr.set(Array.from({ length: arr.length }, (_, i) => i));
          return arr;
        },
      } as Crypto;
      Object.defineProperty(globalThis, "crypto", { value: mock });

      const secret = genSecret();
      expect(secret).toBe(
        Array.from({ length: 16 }, (_, i) =>
          i.toString(16).padStart(2, "0")
        ).join("")
      );
      expect(secret).toHaveLength(32);
    });

    it("produces different secrets on subsequent calls", () => {
      let seed = 0;
      const mock = {
        getRandomValues: (arr: Uint8Array) => {
          for (let i = 0; i < arr.length; i++) arr[i] = seed + i;
          seed += arr.length;
          return arr;
        },
      } as Crypto;
      Object.defineProperty(globalThis, "crypto", { value: mock });

      const first = genSecret(4);
      const second = genSecret(4);
      expect(first).not.toEqual(second);
      expect(first).toHaveLength(8);
      expect(second).toHaveLength(8);
    });
  });

  describe("getCsrfToken", () => {
    const originalCrypto = globalThis.crypto;
    const originalLocation = globalThis.location;

    afterEach(() => {
      document.cookie =
        "csrf_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
      Object.defineProperty(globalThis, "crypto", {
        value: originalCrypto,
        configurable: true,
      });
      Object.defineProperty(globalThis, "location", {
        value: originalLocation,
        configurable: true,
      });
      document.head.innerHTML = "";
      jest.restoreAllMocks();
    });

    it("returns header token from request", () => {
      const req = new Request("https://acme.com", {
        headers: { "x-csrf-token": "header-token" },
      });
      expect(getCsrfToken(req)).toBe("header-token");
    });

    it("returns query param token when header absent", () => {
      const req = new Request("https://acme.com?csrf_token=query-token");
      expect(getCsrfToken(req)).toBe("query-token");
    });

    it("returns cookie token when only cookie header present", () => {
      const req = new Request("https://acme.com", {
        headers: { cookie: "csrf_token=cookie-token" },
      });
      expect(getCsrfToken(req)).toBe("cookie-token");
    });

    it("prefers header token over cookie token", () => {
      const req = new Request("https://acme.com", {
        headers: {
          "x-csrf-token": "header-token",
          cookie: "csrf_token=cookie-token",
        },
      });
      expect(getCsrfToken(req)).toBe("header-token");
    });

    it("returns token from meta tag", () => {
      document.head.innerHTML = '<meta name="csrf-token" content="meta-token">';
      expect(getCsrfToken()).toBe("meta-token");
    });

    it("returns existing csrf_token cookie", () => {
      const mockCrypto = { randomUUID: jest.fn() } as Crypto;
      Object.defineProperty(globalThis, "crypto", {
        value: mockCrypto,
        configurable: true,
      });
      document.cookie = "csrf_token=from-cookie";
      const cookieSpy = jest.spyOn(document, "cookie", "set");
      const token = getCsrfToken();
      expect(token).toBe("from-cookie");
      expect(mockCrypto.randomUUID).not.toHaveBeenCalled();
      expect(cookieSpy).not.toHaveBeenCalled();
    });

    it("generates and stores csrf_token when missing", () => {
      const cookieSpy = jest.spyOn(document, "cookie", "set");
      const mockCrypto = {
        randomUUID: jest.fn().mockReturnValue("uuid-token"),
      };
      Object.defineProperty(globalThis, "crypto", {
        value: mockCrypto,
        configurable: true,
      });
      Object.defineProperty(globalThis, "location", {
        value: { ...originalLocation, protocol: "https:" },
        configurable: true,
      });

      const token = getCsrfToken();
      expect(token).toBe("uuid-token");
      expect(mockCrypto.randomUUID).toHaveBeenCalled();
      expect(cookieSpy).toHaveBeenCalledWith(
        "csrf_token=uuid-token; path=/; SameSite=Strict; secure"
      );
      expect(document.cookie).toBe("");
    });

    it("sets non-secure cookie over http", () => {
      const cookieSpy = jest.spyOn(document, "cookie", "set");
      const mockCrypto = {
        randomUUID: jest.fn().mockReturnValue("plain-token"),
      };
      Object.defineProperty(globalThis, "crypto", {
        value: mockCrypto,
        configurable: true,
      });
      Object.defineProperty(globalThis, "location", {
        value: { ...originalLocation, protocol: "http:" },
        configurable: true,
      });
      const token = getCsrfToken();
      expect(token).toBe("plain-token");
      expect(cookieSpy).toHaveBeenCalledWith(
        "csrf_token=plain-token; path=/; SameSite=Strict"
      );
      expect(document.cookie).toBe("csrf_token=plain-token");
    });
  });
});
