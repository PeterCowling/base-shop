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
jest.mock("../src/components/cms/MediaFileList", () => ({
  __esModule: true,
  default: ({ files, onDelete }: any) => (
    <div>
      {files.map((f: any) => (
        <button key={f.url} onClick={() => onDelete(f.url)}>
          Delete
        </button>
      ))}
    </div>
  ),
}));
import { render, fireEvent, screen } from "@testing-library/react";
import Library from "../src/components/cms/media/Library";

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
