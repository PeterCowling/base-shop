import { fireEvent, render, screen } from "@testing-library/react";

import MediaFileList from "../MediaFileList";

jest.mock("../MediaFileItem", () => (props: any) => (
  <div
    data-cy="media-item"
    data-selected={props.selected ? "true" : "false"}
    onClick={() => props.onSelect?.(props.item)}
  >
    <button type="button" onClick={() => props.onDelete(props.item.url)}>
      delete
    </button>
    <button
      type="button"
      data-cy="bulk"
      onClick={() => props.onBulkToggle?.(props.item, !props.selected)}
    >
      toggle
    </button>
    {props.item.url}
  </div>
));

describe("MediaFileList", () => {
  it("renders items and forwards selection callbacks", () => {
    const files = [
      { url: "1", type: "image" },
      { url: "2", type: "image" },
    ];
    const onSelect = jest.fn();
    render(
      <MediaFileList
        files={files}
        shop="s"
        onDelete={jest.fn()}
        onReplace={jest.fn()}
        onSelect={onSelect}
      />
    );

    const items = screen.getAllByTestId("media-item");
    expect(items).toHaveLength(2);
    fireEvent.click(items[0]);
    expect(onSelect).toHaveBeenCalledWith(files[0]);
  });

  it("derives selection state from the helper", () => {
    const files = [
      { url: "1", type: "image" },
      { url: "2", type: "image" },
    ];
    render(
      <MediaFileList
        files={files}
        shop="s"
        onDelete={jest.fn()}
        onReplace={jest.fn()}
        selectionEnabled
        isItemSelected={(item) => item.url === "2"}
      />
    );

    const items = screen.getAllByTestId("media-item");
    expect(items[0]).toHaveAttribute("data-selected", "false");
    expect(items[1]).toHaveAttribute("data-selected", "true");
  });

  it("forwards bulk toggle events", () => {
    const files = [{ url: "1", type: "image" }];
    const onBulkToggle = jest.fn();
    render(
      <MediaFileList
        files={files}
        shop="s"
        onDelete={jest.fn()}
        onReplace={jest.fn()}
        selectionEnabled
        onBulkToggle={onBulkToggle}
      />
    );

    fireEvent.click(screen.getByTestId("bulk"));
    expect(onBulkToggle).toHaveBeenCalledWith(files[0], true);
  });
});
