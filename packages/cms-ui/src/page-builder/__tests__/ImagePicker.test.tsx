import "../../../../../../../test/resetNextMocks";

import { fireEvent, render, screen } from "@testing-library/react";

import ImagePicker from "../ImagePicker";

const loadMedia = jest.fn();
let mediaState = {
  media: [{ url: "/img.jpg", altText: "img", type: "image" }],
  loading: false,
  error: undefined as string | undefined,
};

jest.mock("../useMediaLibrary", () => ({
  __esModule: true,
  default: () => ({
    ...mediaState,
    setMedia: jest.fn(),
    loadMedia,
    shop: "shop1",
  }),
}));

jest.mock("@acme/ui/hooks/useFileUpload", () => () => ({
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
  beforeEach(() => {
    loadMedia.mockClear();
    mediaState = {
      media: [{ url: "/img.jpg", altText: "img", type: "image" }],
      loading: false,
      error: undefined,
    };
  });

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

  it("loads media when dialog opens", () => {
    render(
      <ImagePicker onSelect={jest.fn()}>
        <button>open</button>
      </ImagePicker>
    );
    fireEvent.click(screen.getByText("open"));
    expect(loadMedia).toHaveBeenCalled();
  });

  it("shows error when mediaError present", () => {
    mediaState.media = [];
    mediaState.error = "oops";
    render(
      <ImagePicker onSelect={jest.fn()}>
        <button>open</button>
      </ImagePicker>
    );
    fireEvent.click(screen.getByText("open"));
    expect(screen.getByText("oops")).toBeInTheDocument();
  });

  it("shows empty message when no media", () => {
    mediaState.media = [];
    render(
      <ImagePicker onSelect={jest.fn()}>
        <button>open</button>
      </ImagePicker>
    );
    fireEvent.click(screen.getByText("open"));
    expect(screen.getByText("No media found.")).toBeInTheDocument();
  });
});
