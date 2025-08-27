import { render, fireEvent, screen } from "@testing-library/react";
import MediaFileList from "./MediaFileList";

jest.mock("./MediaFileItem", () => (props: any) => (
  <div data-testid="media-item" onClick={() => props.onDelete(props.item.url)}>
    item
  </div>
));

describe("MediaFileList", () => {
  it("renders items and forwards callbacks", () => {
    const files = [
      { url: "1", type: "image" },
      { url: "2", type: "image" },
    ];
    const onDelete = jest.fn();
    render(
      <MediaFileList files={files} shop="s" onDelete={onDelete} onReplace={jest.fn()} />
    );

    const items = screen.getAllByTestId("media-item");
    expect(items).toHaveLength(2);
    fireEvent.click(items[0]);
    expect(onDelete).toHaveBeenCalledWith("1");
  });
});
