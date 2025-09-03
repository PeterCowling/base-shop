import React, { useState } from "react";
import { renderHook, render, act } from "@testing-library/react";
import type { MediaItem } from "@acme/types";

jest.mock("@platform-core/hooks/usePublishLocations", () => ({
  usePublishLocations: jest.fn(),
}));

jest.mock("../useFileUpload.tsx", () => ({
  useFileUpload: jest.fn(),
}));

const { usePublishLocations } = require("@platform-core/hooks/usePublishLocations");
const { useFileUpload } = require("../useFileUpload.tsx");

const mockPublishLocations =
  usePublishLocations as jest.MockedFunction<typeof usePublishLocations>;
const mockFileUpload = useFileUpload as jest.MockedFunction<typeof useFileUpload>;

describe("useProductMediaManager", () => {
  const items: MediaItem[] = [
    { url: "/1.png", altText: "", type: "image" },
    { url: "/2.png", altText: "", type: "image" },
    { url: "/3.png", altText: "", type: "image" },
  ];

  beforeEach(() => {
    mockPublishLocations.mockReturnValue({
      locations: [
        { id: "loc1", requiredOrientation: "portrait" } as any,
      ],
    });

    let uploadIndex = 0;
    mockFileUpload.mockImplementation(({ onUploaded }) => ({
      uploader: (
        <button onClick={() => onUploaded(items[uploadIndex++])}>upload</button>
      ),
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("adds, removes and moves media while respecting orientation", () => {
    const { result } = renderHook(() => {
      const [product, setProduct] = useState<any>({ media: [] });
      const manager = require("../useProductMediaManager").useProductMediaManager(
        "shop",
        ["loc1"],
        setProduct
      );
      return { ...manager, product };
    });

    expect(
      mockFileUpload.mock.calls[0][0].requiredOrientation
    ).toBe("portrait");

    const { getByText } = render(result.current.uploader);

    act(() => {
      getByText("upload").click();
      getByText("upload").click();
      getByText("upload").click();
    });
    expect(result.current.product.media).toEqual(items);

    act(() => result.current.removeMedia(1));
    expect(result.current.product.media).toEqual([items[0], items[2]]);

    act(() => result.current.moveMedia(1, 0));
    expect(result.current.product.media).toEqual([items[2], items[0]]);
  });
});

