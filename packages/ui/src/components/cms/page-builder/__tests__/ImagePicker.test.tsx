import { fireEvent, render, screen } from "@testing-library/react";
import ImagePicker from "../ImagePicker";
import "../../../../../../../test/resetNextMocks";

const loadMedia = jest.fn();

jest.mock("../useMediaLibrary", () => ({
  __esModule: true,
  default: () => ({
    media: [{ url: "/img.jpg", altText: "img", type: "image" }],
    setMedia: jest.fn(),
    loadMedia,
    shop: "shop1",
    loading: false,
    error: undefined,
  }),
}));

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

describe("ImagePicker", () => {
  it("selects image and calls onSelect", () => {
    const onSelect = jest.fn();
    render(
      <ImagePicker onSelect={onSelect}>
        <button>open</button>
      </ImagePicker>
    );
    fireEvent.click(screen.getByText("open"));
    fireEvent.click(screen.getByAltText("img"));
    expect(onSelect).toHaveBeenCalledWith("/img.jpg");
  });

  it("search input triggers loadMedia", () => {
    render(
      <ImagePicker onSelect={jest.fn()}>
        <button>open</button>
      </ImagePicker>
    );
    fireEvent.click(screen.getByText("open"));
    const input = screen.getByPlaceholderText("Search media...");
    fireEvent.change(input, { target: { value: "cat" } });
    expect(loadMedia).toHaveBeenLastCalledWith("cat");
  });
});
