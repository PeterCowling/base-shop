import { configure, fireEvent, render, screen } from "@testing-library/react";
import { FileSelector } from "../src/components/atoms/FileSelector";

configure({ testIdAttribute: "data-testid" });

describe("FileSelector", () => {
  it("invokes callback and lists selected files", () => {
    const handle = jest.fn();
    render(<FileSelector onFilesSelected={handle} />);
    const input = screen.getByTestId("file-input") as HTMLInputElement;
    const file = new File(["hello"], "hello.txt", { type: "text/plain" });
    fireEvent.change(input, { target: { files: [file] } });
    expect(handle).toHaveBeenCalledTimes(1);
    expect(handle).toHaveBeenCalledWith([file]);
    expect(screen.getByText("hello.txt")).toBeInTheDocument();
    expect(input).toHaveAttribute("type", "file");
  });

  it("supports multiple file selection", () => {
    render(<FileSelector multiple />);
    const input = screen.getByTestId("file-input");
    expect(input).toHaveAttribute("multiple");
  });
});
