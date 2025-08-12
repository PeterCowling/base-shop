import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ImagePicker from "../ImagePicker";

jest.mock("@ui/hooks/useFileUpload", () => () => ({
  pendingFile: null,
  altText: "",
  setAltText: jest.fn(),
  isValid: null,
  actual: "",
  inputRef: { current: null },
  onFileChange: jest.fn(),
  handleUpload: jest.fn(),
  error: "",
}));

jest.mock("next/navigation", () => ({ usePathname: () => "/shop" }));
jest.mock("next/image", () => (props: any) => <img {...props} />);

describe("ImagePicker", () => {
  it("loads media and selects image", async () => {
    const media = [{ url: "/img.jpg", altText: "img", type: "image" }];
    const fetchSpy = jest
      .spyOn(global, "fetch")
      .mockResolvedValue({ ok: true, json: async () => media } as any);

    const onSelect = jest.fn();
    render(
      <ImagePicker onSelect={onSelect}>
        <button>open</button>
      </ImagePicker>,
    );

    fireEvent.click(screen.getByText("open"));
    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());

    fireEvent.click(await screen.findByAltText("img"));
    expect(onSelect).toHaveBeenCalledWith("/img.jpg");

    fetchSpy.mockRestore();
  });
});
