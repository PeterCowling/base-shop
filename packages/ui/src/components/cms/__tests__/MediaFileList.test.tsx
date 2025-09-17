import { fireEvent, render, screen } from "@testing-library/react";

import MediaFileList from "../MediaFileList";

const mediaFileItemProps: any[] = [];

jest.mock("../MediaFileItem", () => (props: any) => {
  mediaFileItemProps.push(props);
  return (
    <div
      data-cy="media-item"
      data-selected={props.selected ? "true" : "false"}
      data-deleting={props.deleting ? "true" : "false"}
      data-replacing={props.replacing ? "true" : "false"}
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
  );
});

describe("MediaFileList", () => {
  beforeEach(() => {
    mediaFileItemProps.length = 0;
  });

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
        onReplaceSuccess={undefined}
        onReplaceError={undefined}
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
        onReplaceSuccess={undefined}
        onReplaceError={undefined}
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
        onReplaceSuccess={undefined}
        onReplaceError={undefined}
        selectionEnabled
        onBulkToggle={onBulkToggle}
      />
    );

    fireEvent.click(screen.getByTestId("bulk"));
    expect(onBulkToggle).toHaveBeenCalledWith(files[0], true);
  });

  it("derives deletion and replacement states from predicates", () => {
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
        onReplaceSuccess={undefined}
        onReplaceError={undefined}
        isDeleting={(item) => item.url === "1"}
        isReplacing={(item) => item.url === "2"}
      />
    );

    const items = screen.getAllByTestId("media-item");
    expect(items[0]).toHaveAttribute("data-deleting", "true");
    expect(items[0]).toHaveAttribute("data-replacing", "false");
    expect(items[1]).toHaveAttribute("data-deleting", "false");
    expect(items[1]).toHaveAttribute("data-replacing", "true");
  });

  it("forwards replacement callbacks", () => {
    const files = [
      { url: "1", type: "image" },
      { url: "2", type: "image" },
    ];
    const onReplaceSuccess = jest.fn();
    const onReplaceError = jest.fn();

    render(
      <MediaFileList
        files={files}
        shop="s"
        onDelete={jest.fn()}
        onReplace={jest.fn()}
        onReplaceSuccess={onReplaceSuccess}
        onReplaceError={onReplaceError}
      />
    );

    expect(mediaFileItemProps).toHaveLength(files.length);
    for (const props of mediaFileItemProps) {
      expect(props.onReplaceSuccess).toBe(onReplaceSuccess);
      expect(props.onReplaceError).toBe(onReplaceError);
    }
  });
});
