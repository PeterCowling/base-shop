import React from "react";
import { renderHook, render, act, fireEvent } from "@testing-library/react";
import { useProductMediaManager } from "../useProductMediaManager";
import type { ProductWithVariants } from "../useProductInputs";
import { usePublishLocations } from "@acme/platform-core/hooks/usePublishLocations";
import { useFileUpload } from "../useFileUpload";

jest.mock("@acme/platform-core/hooks/usePublishLocations", () => ({
  usePublishLocations: jest.fn(),
}));

jest.mock("../useFileUpload", () => ({
  useFileUpload: jest.fn(),
}));

const mockUsePublishLocations = usePublishLocations as jest.MockedFunction<
  typeof usePublishLocations
>;
const mockUseFileUpload = useFileUpload as jest.MockedFunction<typeof useFileUpload>;

describe("useProductMediaManager", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("adds uploaded media and defaults to landscape orientation", () => { // i18n-exempt: test name
    const media = { url: "/img.png" };
    mockUsePublishLocations.mockReturnValue({
      locations: [],
      reload: jest.fn(),
    });
    type UploadOpts = { onUploaded?: (m: unknown) => void };
    mockUseFileUpload.mockImplementation((opts: UploadOpts) => ({
      uploader: (
        <button onClick={() => opts.onUploaded?.(media)}>upload</button> // i18n-exempt: button label in test
      ),
    }));

    const { result } = renderHook(() => {
      const [product, setProduct] = React.useState<ProductWithVariants>(
        { media: [] } as unknown as ProductWithVariants
      );
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
      const [product, setProduct] = React.useState<ProductWithVariants>(
        { media: [item1, item2, item3] } as unknown as ProductWithVariants
      );
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

  it("moveMedia does nothing when indices are equal", () => { // i18n-exempt
    const item1 = { url: "1.png" };
    const item2 = { url: "2.png" };

    mockUsePublishLocations.mockReturnValue({ locations: [], reload: jest.fn() });
    mockUseFileUpload.mockReturnValue({ uploader: <div /> });

    const { result } = renderHook(() => {
      const [product, setProduct] = React.useState<ProductWithVariants>(
        { media: [item1, item2] } as unknown as ProductWithVariants
      );
      const manager = useProductMediaManager("shop", [], setProduct);
      return { product, ...manager };
    });

    act(() => {
      result.current.moveMedia(1, 1);
    });

    expect(result.current.product.media).toEqual([item1, item2]);
  });

  it("removeMedia updates product media via setProduct", () => { // i18n-exempt
    const item1 = { url: "1.png" };
    const item2 = { url: "2.png" };
    const item3 = { url: "3.png" };

    mockUsePublishLocations.mockReturnValue({ locations: [], reload: jest.fn() });
    mockUseFileUpload.mockReturnValue({ uploader: <div /> });

    let product: ProductWithVariants = {
      media: [item1, item2, item3],
    } as unknown as ProductWithVariants;
    const setProduct = jest.fn(
      (updater: React.SetStateAction<ProductWithVariants>) => {
        product =
          typeof updater === "function"
            ? (updater as (p: ProductWithVariants) => ProductWithVariants)(product)
            : updater;
      }
    );

    const { result } = renderHook(() =>
      useProductMediaManager("shop", [], setProduct)
    );

    act(() => {
      result.current.removeMedia(1);
    });

    expect(product.media).toEqual([item1, item3]);
    expect(setProduct).toHaveBeenCalledTimes(1);
  });

  it("moveMedia reorders product media via setProduct", () => { // i18n-exempt
    const item1 = { url: "1.png" };
    const item2 = { url: "2.png" };
    const item3 = { url: "3.png" };

    mockUsePublishLocations.mockReturnValue({ locations: [], reload: jest.fn() });
    mockUseFileUpload.mockReturnValue({ uploader: <div /> });

    let product: ProductWithVariants = {
      media: [item1, item2, item3],
    } as unknown as ProductWithVariants;
    const setProduct = jest.fn(
      (updater: React.SetStateAction<ProductWithVariants>) => {
        product =
          typeof updater === "function"
            ? (updater as (p: ProductWithVariants) => ProductWithVariants)(product)
            : updater;
      }
    );

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
