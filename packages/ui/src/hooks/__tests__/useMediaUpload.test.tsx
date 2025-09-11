import { act, renderHook } from "@testing-library/react";
import useMediaUpload from "../useMediaUpload";

jest.mock("../useFileUpload.tsx", () => {
  const React = require("react");
  return {
    __esModule: true,
    useFileUpload: jest.fn(() => {
      const [pendingFile, setPendingFile] = React.useState<File | undefined>();
      return { pendingFile, setPendingFile } as any;
    }),
  };
});

describe("useMediaUpload", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("resets thumbnail when pending file is cleared", async () => {
    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;
    const createSpy = jest.fn().mockReturnValue("blob:image");
    const revokeSpy = jest.fn();
    (URL as any).createObjectURL = createSpy;
    (URL as any).revokeObjectURL = revokeSpy;
    const { result } = renderHook(() => useMediaUpload({} as any));

    const file = new File(["a"], "a.png", { type: "image/png" });
    await act(async () => {
      result.current.setPendingFile(file);
    });

    expect(result.current.thumbnail).toBe("blob:image");
    expect(createSpy).toHaveBeenCalledWith(file);

    await act(async () => {
      result.current.setPendingFile(undefined);
    });

    expect(result.current.thumbnail).toBeNull();
    expect(revokeSpy).toHaveBeenCalledWith("blob:image");

    (URL as any).createObjectURL = originalCreate;
    (URL as any).revokeObjectURL = originalRevoke;
  });

  it("creates thumbnail for video when canvas context is available", async () => {
    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;
    const createSpy = jest.fn().mockReturnValue("blob:video");
    const revokeSpy = jest.fn();
    (URL as any).createObjectURL = createSpy;
    (URL as any).revokeObjectURL = revokeSpy;
    const originalCreateElement = document.createElement;
    let video: any;
    const ctx = { drawImage: jest.fn() };
    const dataUrl = "data:image/png;base64,thumb";
    document.createElement = ((tag: string) => {
      if (tag === "video") {
        video = {
          preload: "",
          src: "",
          muted: false,
          playsInline: false,
          onloadeddata: null as any,
          onerror: null as any,
        };
        return video;
      }
      if (tag === "canvas") {
        return {
          width: 0,
          height: 0,
          getContext: () => ctx,
          toDataURL: jest.fn().mockReturnValue(dataUrl),
        };
      }
      return originalCreateElement.call(document, tag);
    }) as any;

    const { result } = renderHook(() => useMediaUpload({} as any));
    const file = new File([""], "v.mp4", { type: "video/mp4" });

    await act(async () => {
      result.current.setPendingFile(file);
    });

    await act(async () => {
      video.onloadeddata();
      await Promise.resolve();
    });

    expect(ctx.drawImage).toHaveBeenCalled();
    expect(result.current.thumbnail).toBe(dataUrl);
    expect(revokeSpy).toHaveBeenCalledWith("blob:video");

    document.createElement = originalCreateElement;
    (URL as any).createObjectURL = originalCreate;
    (URL as any).revokeObjectURL = originalRevoke;
  });

  it("falls back to video src when canvas context is missing", async () => {
    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;
    (URL as any).createObjectURL = jest.fn().mockReturnValue("blob:video");
    const revokeSpy = jest.fn();
    (URL as any).revokeObjectURL = revokeSpy;
    const originalCreateElement = document.createElement;
    let video: any;
    document.createElement = ((tag: string) => {
      if (tag === "video") {
        video = {
          preload: "",
          src: "",
          muted: false,
          playsInline: false,
          onloadeddata: null as any,
          onerror: null as any,
        };
        return video;
      }
      if (tag === "canvas") {
        return {
          width: 0,
          height: 0,
          getContext: () => null,
        };
      }
      return originalCreateElement.call(document, tag);
    }) as any;

    const { result } = renderHook(() => useMediaUpload({} as any));
    const file = new File([""], "v.mp4", { type: "video/mp4" });

    await act(async () => {
      result.current.setPendingFile(file);
    });

    await act(async () => {
      video.onloadeddata();
      await Promise.resolve();
    });

    expect(result.current.thumbnail).toBe("blob:video");
    expect(revokeSpy).toHaveBeenCalledWith("blob:video");

    document.createElement = originalCreateElement;
    (URL as any).createObjectURL = originalCreate;
    (URL as any).revokeObjectURL = originalRevoke;
  });

  it("uses video src when an error occurs", async () => {
    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;
    (URL as any).createObjectURL = jest.fn().mockReturnValue("blob:video");
    const revokeSpy = jest.fn();
    (URL as any).revokeObjectURL = revokeSpy;
    const originalCreateElement = document.createElement;
    let video: any;
    document.createElement = ((tag: string) => {
      if (tag === "video") {
        video = {
          preload: "",
          src: "",
          muted: false,
          playsInline: false,
          onloadeddata: null as any,
          onerror: null as any,
        };
        return video;
      }
      return originalCreateElement.call(document, tag);
    }) as any;

    const { result } = renderHook(() => useMediaUpload({} as any));
    const file = new File([""], "v.mp4", { type: "video/mp4" });

    await act(async () => {
      result.current.setPendingFile(file);
    });

    await act(async () => {
      video.onerror();
      await Promise.resolve();
    });

    expect(result.current.thumbnail).toBe("blob:video");
    expect(revokeSpy).toHaveBeenCalledWith("blob:video");

    document.createElement = originalCreateElement;
    (URL as any).createObjectURL = originalCreate;
    (URL as any).revokeObjectURL = originalRevoke;
  });

  it("does not update state after unmount before video thumbnail loads", async () => {
    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;
    (URL as any).createObjectURL = jest.fn().mockReturnValue("blob:video");
    const revokeSpy = jest.fn();
    (URL as any).revokeObjectURL = revokeSpy;
    const originalCreateElement = document.createElement;
    let video: any;
    const ctx = { drawImage: jest.fn() };
    const dataUrl = "data:image/png;base64,thumb";
    document.createElement = ((tag: string) => {
      if (tag === "video") {
        video = {
          preload: "",
          src: "",
          muted: false,
          playsInline: false,
          onloadeddata: null as any,
          onerror: null as any,
        };
        return video;
      }
      if (tag === "canvas") {
        return {
          width: 0,
          height: 0,
          getContext: () => ctx,
          toDataURL: jest.fn().mockReturnValue(dataUrl),
        };
      }
      return originalCreateElement.call(document, tag);
    }) as any;

    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const { result, unmount } = renderHook(() => useMediaUpload({} as any));
    const file = new File([""], "v.mp4", { type: "video/mp4" });

    await act(async () => {
      result.current.setPendingFile(file);
    });

    expect(result.current.thumbnail).toBeNull();

    unmount();

    await act(async () => {
      video.onloadeddata();
      await Promise.resolve();
    });

    expect(result.current.thumbnail).toBeNull();
    expect(revokeSpy).toHaveBeenCalledWith("blob:video");
    expect(errorSpy).not.toHaveBeenCalled();

    errorSpy.mockRestore();
    document.createElement = originalCreateElement;
    (URL as any).createObjectURL = originalCreate;
    (URL as any).revokeObjectURL = originalRevoke;
  });
});

