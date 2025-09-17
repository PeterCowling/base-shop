jest.mock("@ui/components/atoms/shadcn", () => {
  const React = require("react");
  return {
    Input: (props: any) => <input {...props} />,
    Select: ({ children, ...rest }: any) => <select {...rest}>{children}</select>,
    SelectTrigger: ({ children }: any) => <div>{children}</div>,
    SelectValue: ({ placeholder }: any) => <option>{placeholder}</option>,
    SelectContent: ({ children }: any) => <div>{children}</div>,
    SelectItem: ({ children, ...rest }: any) => <option {...rest}>{children}</option>,
  };
});
const mockMediaFileList = jest.fn(
  ({ files, onDelete, isItemSelected }: any) => (
    <div>
      {files.map((f: any) => (
        <button key={f.url} onClick={() => onDelete(f.url)}>
          Delete
        </button>
      ))}
      {isItemSelected ? (
        <div data-testid="selection-state">
          {files.map((f: any) => String(isItemSelected(f))).join(",")}
        </div>
      ) : null}
    </div>
  )
);

jest.mock("../src/components/cms/MediaFileList", () => ({
  __esModule: true,
  default: (props: any) => mockMediaFileList(props),
}));
import { render, fireEvent, screen } from "@testing-library/react";
import Library from "../src/components/cms/media/Library";

beforeEach(() => {
  mockMediaFileList.mockClear();
});

test("filters files by search", () => {
  render(
    <Library
      files={[
        { url: "/a.jpg" } as any,
        { url: "/dog.jpg" } as any,
      ]}
      shop="s"
      onDelete={() => {}}
      onReplace={() => {}}
    />
  );
  expect(screen.getAllByText("Delete")).toHaveLength(2);
  fireEvent.change(screen.getByPlaceholderText("Search media..."), {
    target: { value: "dog" },
  });
  expect(screen.getAllByText("Delete")).toHaveLength(1);
});

test("derives selection helper from selectedUrl", () => {
  render(
    <Library
      files={[
        { url: "/a.jpg" } as any,
        { url: "/dog.jpg" } as any,
      ]}
      shop="s"
      onDelete={() => {}}
      onReplace={() => {}}
      selectedUrl="/dog.jpg"
    />
  );

  expect(mockMediaFileList).toHaveBeenCalledTimes(1);
  const props = mockMediaFileList.mock.calls[0][0];
  expect(props.isItemSelected).toBeInstanceOf(Function);
  expect(props.isItemSelected({ url: "/dog.jpg" })).toBe(true);
  expect(props.isItemSelected({ url: "/a.jpg" })).toBe(false);
});
