// i18n-exempt: test file uses literal strings for clarity
// packages/ui/src/hooks/__tests__/useFileUpload.process.test.tsx
import { renderHook, act } from "@testing-library/react";
import type { DragEvent as ReactDragEvent } from "react";
import type { ImageOrientation } from "@acme/types";
import type { UseFileUploadOptions } from "../useFileUpload";

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

type MockFileList = {
  length: number;
  item: (index: number) => File | null;
  [index: number]: File | undefined;
};

function makeDT(
  overrides: Partial<DataTransfer> & {
    files?: MockFileList;
    getData?: (t: string) => string;
  } = {},
): DataTransfer {
  const base: Partial<DataTransfer> & { files: MockFileList; getData: (t: string) => string } = {
    files: overrides.files ?? { 0: undefined, length: 0, item: () => null },
    getData: overrides.getData ?? ((_: string) => ""),
  };
  return base as unknown as DataTransfer;
}

describe("useFileUpload.processDataTransfer", () => {
  test("handles file with passing policy", async () => {
    (validateFilePolicy as jest.MockedFunction<typeof validateFilePolicy>).mockReturnValueOnce(undefined);
    const file = new File([1], "a.png", { type: "image/png" });
    const files: MockFileList = { 0: file, length: 1, item: () => file };
    const dt = makeDT({ files });
    const opts: UseFileUploadOptions = { shop: "s", requiredOrientation: "landscape" as ImageOrientation };
    const { result } = renderHook(() => useFileUpload(opts));
    const handled = await act(
      async () => await result.current.processDataTransfer({ dataTransfer: dt } as unknown as ReactDragEvent<HTMLDivElement>),
    );
    expect(handled).toBe("file");
    expect(result.current.pendingFile).toBe(file);
  });

  test("blocks file by policy and returns none with error", async () => {
    (validateFilePolicy as jest.MockedFunction<typeof validateFilePolicy>).mockReturnValueOnce("Unsupported");
    const file = new File([1], "a.txt", { type: "text/plain" });
    const dt = makeDT({ files: { 0: file, length: 1, item: () => file } });
    const opts: UseFileUploadOptions = { shop: "s", requiredOrientation: "landscape" as ImageOrientation };
    const { result } = renderHook(() => useFileUpload(opts));
    const handled = await act(
      async () => await result.current.processDataTransfer({ dataTransfer: dt } as unknown as ReactDragEvent<HTMLDivElement>),
    );
    expect(handled).toBe("none");
    expect(result.current.pendingFile).toBeNull();
    expect(result.current.error).toBe("Unsupported");
  });

  test("ingests via text/uri-list URL", async () => {
    const dt = makeDT({ getData: (t: string) => (t === "text/uri-list" ? "https://a.com/p.png" : "") });
    const opts: UseFileUploadOptions = { shop: "s", requiredOrientation: "landscape" as ImageOrientation };
    const { result } = renderHook(() => useFileUpload(opts));
    const handled = await act(
      async () => await result.current.processDataTransfer({ dataTransfer: dt } as unknown as ReactDragEvent<HTMLDivElement>),
    );
    expect(ingestExternalUrl).toHaveBeenCalled();
    expect(handled).toBe("url");
    expect(result.current.pendingFile?.name).toBe("u.png");
  });

  test("ingestExternalUrl error yields none", async () => {
    (ingestExternalUrl as jest.MockedFunction<typeof ingestExternalUrl>).mockResolvedValueOnce({
      file: null,
      error: "bad",
      handled: "url",
    });
    const dt = makeDT({ getData: (t: string) => (t === "text/uri-list" ? "https://a.com/p.png" : "") });
    const opts: UseFileUploadOptions = { shop: "s", requiredOrientation: "landscape" as ImageOrientation };
    const { result } = renderHook(() => useFileUpload(opts));
    const handled = await act(
      async () => await result.current.processDataTransfer({ dataTransfer: dt } as unknown as ReactDragEvent<HTMLDivElement>),
    );
    expect(handled).toBe("none");
    expect(result.current.pendingFile).toBeNull();
    expect(result.current.error).toBe("bad");
  });

  test("ingests from plain text when no url provided", async () => {
    const dt = makeDT({ getData: (t: string) => (t === "text/plain" ? "see https://a.com/p.png" : "") });
    const opts: UseFileUploadOptions = { shop: "s", requiredOrientation: "landscape" as ImageOrientation };
    const { result } = renderHook(() => useFileUpload(opts));
    const handled = await act(
      async () => await result.current.processDataTransfer({ dataTransfer: dt } as unknown as ReactDragEvent<HTMLDivElement>),
    );
    expect(ingestFromText).toHaveBeenCalled();
    expect(handled).toBe("url");
    expect(result.current.pendingFile?.name).toBe("t.png");
  });

  test("ingestFromText returning handled=text returns text", async () => {
    (ingestFromText as jest.MockedFunction<typeof ingestFromText>).mockResolvedValueOnce({ file: null, handled: "text" });
    const dt = makeDT({ getData: (t: string) => (t === "text/plain" ? "plain text" : "") });
    const opts: UseFileUploadOptions = { shop: "s", requiredOrientation: "landscape" as ImageOrientation };
    const { result } = renderHook(() => useFileUpload(opts));
    const handled = await act(
      async () => await result.current.processDataTransfer({ dataTransfer: dt } as unknown as ReactDragEvent<HTMLDivElement>),
    );
    expect(handled).toBe("text");
    expect(result.current.pendingFile).toBeNull();
  });
});
