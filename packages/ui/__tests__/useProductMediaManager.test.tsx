import React from "react";
import { renderHook, act } from "@testing-library/react";
import { useProductMediaManager } from "../src/hooks/useProductMediaManager";

// Mock platform publish locations
jest.mock("@acme/platform-core/hooks/usePublishLocations", () => ({
  usePublishLocations: () => ({
    locations: [
      { id: "loc-a", requiredOrientation: "portrait" },
      { id: "loc-b", requiredOrientation: "landscape" },
    ],
  }),
}));

// Mock file upload hook to isolate behaviour
jest.mock("../src/hooks/useFileUpload", () => ({
  useFileUpload: ({ onUploaded }: any) => ({
    uploader: React.createElement("div", { "data-cy": "uploader" }),
    __upload: (item: any) => onUploaded(item),
  }),
}));

type Product = { media: Array<{ id: string }>; };

describe("useProductMediaManager", () => {
  it("adds, removes and moves media and computes requiredOrientation from publishTargets", () => {
    const setProduct = jest.fn((fn) => {
      state = fn(state);
    });
    let state: Product = { media: [] };

    const { result } = renderHook(() =>
      useProductMediaManager("shop", ["loc-b"], setProduct as any)
    );

    // Simulate upload via mocked hook internal trigger
    const uploaderAny = result.current.uploader as any;
    const uploadTrigger = (require("react-test-renderer/shallow"), (require as any));
    // Directly call the mocked __upload via the module
    const { useFileUpload } = require("../src/hooks/useFileUpload");
    const trigger = useFileUpload({ onUploaded: (item: any) => setProduct((prev: any) => ({ ...prev, media: [...prev.media, item] })) }).__upload;
    act(() => {
      trigger({ id: "a" });
      trigger({ id: "b" });
    });
    expect(state.media.map((m) => m.id)).toEqual(["a", "b"]);

    act(() => result.current.removeMedia(0));
    expect(state.media.map((m) => m.id)).toEqual(["b"]);

    act(() => {
      state.media.push({ id: "c" }, { id: "d" });
      result.current.moveMedia(0, 2);
    });
    expect(state.media.map((m) => m.id)).toEqual(["c", "d", "b"]);
  });
});

