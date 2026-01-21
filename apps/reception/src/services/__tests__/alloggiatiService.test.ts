// src/services/__tests__/sendAlloggiatiService.test.ts

import "@testing-library/jest-dom";
import { sendAlloggiatiRecordsToGoogleScript } from "../alloggiatiService";

// Utility to clean up any JSONP callbacks left on the window
function cleanupJSONPCallbacks(): void {
  Object.keys(window).forEach((k) => {
    if (k.startsWith("jsonpCallback_")) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (window as any)[k];
    }
  });
}

describe("sendAlloggiatiRecordsToGoogleScript", () => {
  let originalCreateElement: typeof document.createElement;
  let scriptEl: HTMLScriptElement | null;
  type AppendChildFn = typeof document.body.appendChild;
  let appendSpy: MockInstance<AppendChildFn>; // ✅ only one type arg

  beforeEach(() => {
    scriptEl = null;
    originalCreateElement = document.createElement.bind(document);
    jest.restoreAllMocks();

    jest.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const el = originalCreateElement(tag);
      if (tag === "script") {
        scriptEl = el as HTMLScriptElement;
      }
      return el;
    });

    appendSpy = jest.spyOn(document.body, "appendChild");
  });

  afterEach(() => {
    jest.restoreAllMocks();
    document.body.innerHTML = "";
    cleanupJSONPCallbacks();
  });

  it("resolves when JSONP callback fires", async () => {
    const promise = sendAlloggiatiRecordsToGoogleScript(["A", "B"], true);

    expect(appendSpy).toHaveBeenCalled();
    expect(scriptEl).not.toBeNull();

    const cbName = new URL(
      (scriptEl as HTMLScriptElement).src
    ).searchParams.get("callback") as string;

    const response = {
      resultDetails: [
        { recordNumber: "1", status: "ok" },
        {
          recordNumber: "2",
          status: "error",
          erroreCod: "E1",
          erroreDes: "desc",
          erroreDettaglio: "detail",
          occupantRecord: "REC2",
          occupantRecordLength: 4,
        },
      ],
    };

    // Trigger the JSONP callback
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any)[cbName](response);

    const result = await promise;

    expect(result).toEqual(response.resultDetails);

    // Callback removed and script detached
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((window as any)[cbName]).toBeUndefined();
    expect((scriptEl as HTMLScriptElement).parentNode).toBeNull();
  });

  it("rejects when script errors", async () => {
    const promise = sendAlloggiatiRecordsToGoogleScript(["X"], false);

    expect(appendSpy).toHaveBeenCalled();
    expect(scriptEl).not.toBeNull();

    const cbName = new URL(
      (scriptEl as HTMLScriptElement).src
    ).searchParams.get("callback") as string;

    // Trigger onerror handler
    (scriptEl as HTMLScriptElement).onerror?.(new Event("error"));

    await expect(promise).rejects.toThrow(
      "Network error loading JSONP script."
    );

    // Callback removed and script detached
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((window as any)[cbName]).toBeUndefined();
    expect((scriptEl as HTMLScriptElement).parentNode).toBeNull();
  });

  it("rejects when callback payload is invalid", async () => {
    const promise = sendAlloggiatiRecordsToGoogleScript(["Z"], true);

    expect(appendSpy).toHaveBeenCalled();
    expect(scriptEl).not.toBeNull();

    const cbName = new URL(
      (scriptEl as HTMLScriptElement).src
    ).searchParams.get("callback") as string;

    const invalid = { foo: "bar" };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any)[cbName](invalid);

    await expect(promise).rejects.toThrow(/Invalid response format/);

    // Callback removed and script detached
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((window as any)[cbName]).toBeUndefined();
    expect((scriptEl as HTMLScriptElement).parentNode).toBeNull();
  });
});
