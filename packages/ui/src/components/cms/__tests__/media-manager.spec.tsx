import { render, waitFor } from "@testing-library/react";
import MediaManager from "../MediaManager";

let libraryProps: any;
let uploadProps: any;

jest.mock("../media/Library", () => (props: any) => {
  libraryProps = props;
  return <div data-testid="library" />;
});

jest.mock("../media/UploadPanel", () => (props: any) => {
  uploadProps = props;
  return <div data-testid="upload" />;
});

describe("MediaManager", () => {
  const initialFiles = [
    { url: "1", type: "image" },
    { url: "2", type: "image" },
  ];
  const originalConfirm = window.confirm;

  afterEach(() => {
    window.confirm = originalConfirm;
    jest.clearAllMocks();
  });

  it("does nothing when deletion is not confirmed", async () => {
    window.confirm = jest.fn(() => false);
    const onDelete = jest.fn();
    render(<MediaManager shop="s" initialFiles={initialFiles} onDelete={onDelete} />);

    await libraryProps.onDelete("1");

    expect(onDelete).not.toHaveBeenCalled();
    expect(libraryProps.files).toHaveLength(2);
  });

  it("deletes item when confirmed", async () => {
    window.confirm = jest.fn(() => true);
    const onDelete = jest.fn();
    render(<MediaManager shop="s" initialFiles={initialFiles} onDelete={onDelete} />);

    await libraryProps.onDelete("1");

    expect(onDelete).toHaveBeenCalledWith("s", "1");
    await waitFor(() => expect(libraryProps.files).toHaveLength(1));
    expect(libraryProps.files.find((f: any) => f.url === "1")).toBeUndefined();
  });

  it("adds uploaded items", async () => {
    const onDelete = jest.fn();
    render(<MediaManager shop="s" initialFiles={initialFiles} onDelete={onDelete} />);

    uploadProps.onUploaded({ url: "3", type: "image" });

    await waitFor(() => expect(libraryProps.files[0].url).toBe("3"));
    expect(libraryProps.files).toHaveLength(3);
  });

  it("replaces existing items", async () => {
    const onDelete = jest.fn();
    render(<MediaManager shop="s" initialFiles={initialFiles} onDelete={onDelete} />);

    libraryProps.onReplace("1", { url: "1b", type: "image" });

    await waitFor(() => expect(libraryProps.files[0].url).toBe("1b"));
    expect(libraryProps.files[1].url).toBe("2");
  });
});

