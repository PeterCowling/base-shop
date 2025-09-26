// packages/ui/src/hooks/__tests__/useFileUpload.process.test.tsx
import { renderHook, act } from "@testing-library/react";

// Mocks for policy and ingestion
jest.mock("../upload/filePolicy", () => ({
  validateFilePolicy: jest.fn(() => undefined),
}));
jest.mock("../upload/ingestExternalUrl", () => ({
  ingestExternalUrl: jest.fn(async () => ({ file: new File([1], "u.png", { type: "image/png" }), handled: "url" })),
  ingestFromText: jest.fn(async (text: string) => ({ file: new File([1], "t.png", { type: "image/png" }), handled: text ? "url" : "none" })),
}));

import { validateFilePolicy } from "../upload/filePolicy";
import { ingestExternalUrl, ingestFromText } from "../upload/ingestExternalUrl";
import useFileUpload from "../useFileUpload";

function makeDT(overrides: Partial<DataTransfer> & { files?: FileList | any; getData?: (t: string) => string } = {}): DataTransfer {
  const base: any = {
    files: overrides.files ?? { 0: undefined, length: 0, item: () => null },
    getData: overrides.getData ?? ((_: string) => ""),
  };
  return base as unknown as DataTransfer;
}

describe("useFileUpload.processDataTransfer", () => {
  test("handles file with passing policy", async () => {
    (validateFilePolicy as jest.Mock).mockReturnValueOnce(undefined);
    const file = new File([1], "a.png", { type: "image/png" });
    const files: any = { 0: file, length: 1, item: () => file };
    const dt = makeDT({ files });
    const { result } = renderHook(() => useFileUpload({ shop: "s", requiredOrientation: "landscape" } as any));
    const handled = await act(async () => await result.current.processDataTransfer({ dataTransfer: dt } as any));
    expect(handled).toBe("file");
    expect(result.current.pendingFile).toBe(file);
  });

  test("blocks file by policy and returns none with error", async () => {
    (validateFilePolicy as jest.Mock).mockReturnValueOnce("Unsupported");
    const file = new File([1], "a.txt", { type: "text/plain" });
    const dt = makeDT({ files: { 0: file, length: 1, item: () => file } as any });
    const { result } = renderHook(() => useFileUpload({ shop: "s", requiredOrientation: "landscape" } as any));
    const handled = await act(async () => await result.current.processDataTransfer({ dataTransfer: dt } as any));
    expect(handled).toBe("none");
    expect(result.current.pendingFile).toBeNull();
    expect(result.current.error).toBe("Unsupported");
  });

  test("ingests via text/uri-list URL", async () => {
    const dt = makeDT({ getData: (t: string) => (t === "text/uri-list" ? "https://a.com/p.png" : "") });
    const { result } = renderHook(() => useFileUpload({ shop: "s", requiredOrientation: "landscape" } as any));
    const handled = await act(async () => await result.current.processDataTransfer({ dataTransfer: dt } as any));
    expect(ingestExternalUrl).toHaveBeenCalled();
    expect(handled).toBe("url");
    expect(result.current.pendingFile?.name).toBe("u.png");
  });

  test("ingestExternalUrl error yields none", async () => {
    (ingestExternalUrl as jest.Mock).mockResolvedValueOnce({ file: null, error: "bad", handled: "url" });
    const dt = makeDT({ getData: (t: string) => (t === "text/uri-list" ? "https://a.com/p.png" : "") });
    const { result } = renderHook(() => useFileUpload({ shop: "s", requiredOrientation: "landscape" } as any));
    const handled = await act(async () => await result.current.processDataTransfer({ dataTransfer: dt } as any));
    expect(handled).toBe("none");
    expect(result.current.pendingFile).toBeNull();
    expect(result.current.error).toBe("bad");
  });

  test("ingests from plain text when no url provided", async () => {
    const dt = makeDT({ getData: (t: string) => (t === "text/plain" ? "see https://a.com/p.png" : "") });
    const { result } = renderHook(() => useFileUpload({ shop: "s", requiredOrientation: "landscape" } as any));
    const handled = await act(async () => await result.current.processDataTransfer({ dataTransfer: dt } as any));
    expect(ingestFromText).toHaveBeenCalled();
    expect(handled).toBe("url");
    expect(result.current.pendingFile?.name).toBe("t.png");
  });

  test("ingestFromText returning handled=text returns text", async () => {
    (ingestFromText as jest.Mock).mockResolvedValueOnce({ file: null, handled: "text" });
    const dt = makeDT({ getData: (t: string) => (t === "text/plain" ? "plain text" : "") });
    const { result } = renderHook(() => useFileUpload({ shop: "s", requiredOrientation: "landscape" } as any));
    const handled = await act(async () => await result.current.processDataTransfer({ dataTransfer: dt } as any));
    expect(handled).toBe("text");
    expect(result.current.pendingFile).toBeNull();
  });
});

