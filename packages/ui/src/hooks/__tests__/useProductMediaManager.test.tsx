import React from "react";
import { renderHook, render, act, fireEvent } from "@testing-library/react";
import { useProductMediaManager } from "../useProductMediaManager";
import type { ProductWithVariants } from "../useProductInputs";

jest.mock("@platform-core/hooks/usePublishLocations", () => ({
  usePublishLocations: jest.fn(),
}));

jest.mock("../useFileUpload", () => ({
  useFileUpload: jest.fn(),
}));

const { usePublishLocations } = require("@platform-core/hooks/usePublishLocations");
const { useFileUpload } = require("../useFileUpload");

const mockUsePublishLocations = usePublishLocations as jest.MockedFunction<
  typeof usePublishLocations
>;
const mockUseFileUpload = useFileUpload as jest.MockedFunction<typeof useFileUpload>;

describe("useProductMediaManager", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("adds uploaded media and defaults to landscape orientation", () => {
    const media = { url: "/img.png" };
    mockUsePublishLocations.mockReturnValue({
      locations: [],
      reload: jest.fn(),
    });
    mockUseFileUpload.mockImplementation((opts: any) => ({
      uploader: <button onClick={() => opts.onUploaded?.(media)}>upload</button>,
    }));

    const { result } = renderHook(() => {
      const [product, setProduct] = React.useState<ProductWithVariants>({
        media: [],
      } as any);
      const manager = useProductMediaManager("shop", [], setProduct);
      return { product, ...manager };
    });

    expect(mockUseFileUpload).toHaveBeenCalledWith(
      expect.objectContaining({ requiredOrientation: "landscape" })
    );

    const { getByText } = render(result.current.uploader);
    act(() => {
      fireEvent.click(getByText("upload"));
    });

    expect(result.current.product.media).toEqual([media]);
  });

  it("removeMedia and moveMedia update product media", () => {
    const item1 = { url: "1.png" };
    const item2 = { url: "2.png" };
    const item3 = { url: "3.png" };

    mockUsePublishLocations.mockReturnValue({ locations: [], reload: jest.fn() });
    mockUseFileUpload.mockReturnValue({ uploader: <div /> });

    const { result } = renderHook(() => {
      const [product, setProduct] = React.useState<ProductWithVariants>({
        media: [item1, item2, item3],
      } as any);
      const manager = useProductMediaManager("shop", [], setProduct);
      return { product, ...manager };
    });

    act(() => {
      result.current.removeMedia(1);
    });
    expect(result.current.product.media).toEqual([item1, item3]);

    act(() => {
      result.current.moveMedia(1, 0);
    });
    expect(result.current.product.media).toEqual([item3, item1]);
  });

  it("moveMedia does nothing when indices are equal", () => {
    const item1 = { url: "1.png" };
    const item2 = { url: "2.png" };

    mockUsePublishLocations.mockReturnValue({ locations: [], reload: jest.fn() });
    mockUseFileUpload.mockReturnValue({ uploader: <div /> });

    const { result } = renderHook(() => {
      const [product, setProduct] = React.useState<ProductWithVariants>({
        media: [item1, item2],
      } as any);
      const manager = useProductMediaManager("shop", [], setProduct);
      return { product, ...manager };
    });

    act(() => {
      result.current.moveMedia(1, 1);
    });

    expect(result.current.product.media).toEqual([item1, item2]);
  });

  it("removeMedia updates product media via setProduct", () => {
    const item1 = { url: "1.png" };
    const item2 = { url: "2.png" };
    const item3 = { url: "3.png" };

    mockUsePublishLocations.mockReturnValue({ locations: [], reload: jest.fn() });
    mockUseFileUpload.mockReturnValue({ uploader: <div /> });

    let product: ProductWithVariants = { media: [item1, item2, item3] } as any;
    const setProduct = jest.fn((updater: any) => {
      product = typeof updater === "function" ? updater(product) : updater;
    });

    const { result } = renderHook(() =>
      useProductMediaManager("shop", [], setProduct)
    );

    act(() => {
      result.current.removeMedia(1);
    });

    expect(product.media).toEqual([item1, item3]);
    expect(setProduct).toHaveBeenCalledTimes(1);
  });

  it("moveMedia reorders product media via setProduct", () => {
    const item1 = { url: "1.png" };
    const item2 = { url: "2.png" };
    const item3 = { url: "3.png" };

    mockUsePublishLocations.mockReturnValue({ locations: [], reload: jest.fn() });
    mockUseFileUpload.mockReturnValue({ uploader: <div /> });

    let product: ProductWithVariants = { media: [item1, item2, item3] } as any;
    const setProduct = jest.fn((updater: any) => {
      product = typeof updater === "function" ? updater(product) : updater;
    });

    const { result } = renderHook(() =>
      useProductMediaManager("shop", [], setProduct)
    );

    act(() => {
      result.current.moveMedia(2, 0);
    });

    expect(product.media).toEqual([item3, item1, item2]);
    expect(setProduct).toHaveBeenCalledTimes(1);
  });
});

