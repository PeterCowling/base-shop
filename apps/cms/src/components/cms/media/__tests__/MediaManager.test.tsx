import {
  render,
  fireEvent,
  waitFor,
  act,
  screen,
} from "@testing-library/react";
import MediaManager from "../MediaManager";

describe("MediaManager", () => {
  const originalFetch = global.fetch;
  const originalConfirm = window.confirm;

  afterEach(() => {
    global.fetch = originalFetch;
    window.confirm = originalConfirm;
    jest.clearAllMocks();
  });

  it("uploads dropped files and shows progress", async () => {
    const onDelete = jest.fn();
    let resolveFetch: (value: Response) => void;
    global.fetch = jest.fn(
      () =>
        new Promise((res) => {
          resolveFetch = res;
        })
    ) as any;

    const { getByLabelText, getByText, queryByText, queryAllByText } = render(
      <MediaManager shop="shop" initialFiles={[]} onDelete={onDelete} />
    );

    const dropzone = getByLabelText(/drop image or video here/i);
    const file = new File(["file"], "video.mp4", { type: "video/mp4" });
    fireEvent.drop(dropzone, { dataTransfer: { files: [file] } });

    const uploadButton = getByText("Upload");
    fireEvent.click(uploadButton);

    const progressEl = getByText("Uploaded 0/1");
    expect(progressEl).toBeInTheDocument();

    await act(async () => {
      resolveFetch!(
        new Response(
          JSON.stringify({ url: "new.mp4", type: "video" }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );
    });
    await waitFor(() =>
      expect(queryByText("Uploaded 0/1")).not.toBeInTheDocument()
    );
    await waitFor(() =>
      expect(screen.getAllByText("new.mp4").length).toBeGreaterThan(0)
    );
  });

  it("calls onDelete when confirming deletion", async () => {
    window.confirm = jest.fn(() => true);
    const onDelete = jest.fn().mockResolvedValue(undefined);
    const { getByLabelText } = render(
      <MediaManager
        shop="shop"
        initialFiles={[{ url: "old.mp4", type: "video" }]}
        onDelete={onDelete}
      />
    );

    const trigger = getByLabelText("Media actions");
    fireEvent.pointerDown(trigger);
    fireEvent.keyDown(trigger, { key: "Enter" });
    const deleteButton = await screen.findByText("Delete");
    fireEvent.click(deleteButton);

    await waitFor(() =>
      expect(onDelete).toHaveBeenCalledWith("shop", "old.mp4")
    );
    await waitFor(() =>
      expect(screen.queryByText("Delete")).not.toBeInTheDocument()
    );
  });

  it("displays error message when upload fails", async () => {
    const onDelete = jest.fn();
    global.fetch = jest.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ error: "Upload failed" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    ) as any;

    const { getByLabelText, getByText, findByText } = render(
      <MediaManager shop="shop" initialFiles={[]} onDelete={onDelete} />
    );

    const dropzone = getByLabelText(/drop image or video here/i);
    const file = new File(["file"], "video.mp4", { type: "video/mp4" });
    fireEvent.drop(dropzone, { dataTransfer: { files: [file] } });

    fireEvent.click(getByText("Upload"));

    await findByText("Upload failed");
  });
});
