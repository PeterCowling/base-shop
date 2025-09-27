// packages/ui/src/hooks/__tests__/useMediaUpload.video.test.tsx
import { renderHook } from "@testing-library/react";

describe("useMediaUpload (video thumbnail path)", () => {
  const originalCreate = URL.createObjectURL;
  const originalCreateEl = document.createElement;

  afterEach(() => {
    // @ts-expect-error: restore stubbed API
    URL.createObjectURL = originalCreate;
    // @ts-expect-error: restore stubbed API
    document.createElement = originalCreateEl as any;
    jest.resetModules();
  });

  test("creates thumbnail from video via canvas", async () => {
    jest.doMock("../useFileUpload", () => ({
      useFileUpload: () => ({ pendingFile: new File([1], "v.mp4", { type: "video/mp4" }) }),
    }));
    const { default: useMediaUpload } = await import("../useMediaUpload");

    // Stub object URL
    // @ts-expect-error: test stubs object URL API
    URL.createObjectURL = jest.fn(() => "blob:video");

    // Fake video + canvas
    const fakeVideo: any = {
      preload: "metadata",
      src: "",
      muted: false,
      playsInline: true,
      videoWidth: 320,
      videoHeight: 180,
      onloadeddata: null as null | (() => void),
    };
    const fakeCanvas: any = {
      width: 0,
      height: 0,
      getContext: () => ({ drawImage: jest.fn() }),
      toDataURL: () => "data:video-thumb",
    };
    // @ts-expect-error: override createElement for test
    document.createElement = (tag: string) => {
      if (tag === "video") return fakeVideo as any;
      if (tag === "canvas") return fakeCanvas as any;
      return originalCreateEl.call(document, tag) as any;
    };

    const { result } = renderHook(() => useMediaUpload({ shop: "s", requiredOrientation: "landscape" } as any));

    await (await import("@testing-library/react")).act(async () => {
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          if (fakeVideo.onloadeddata) fakeVideo.onloadeddata();
          resolve();
        }, 0);
      });
    });

    expect(result.current.thumbnail).toBe("data:video-thumb");
  });
});
