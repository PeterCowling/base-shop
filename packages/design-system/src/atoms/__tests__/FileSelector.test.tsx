import "../../../../../../test/resetNextMocks";

import { configure,fireEvent, render, screen } from "@testing-library/react";

import { FileSelector } from "../FileSelector";

configure({ testIdAttribute: "data-testid" });

describe("FileSelector", () => {
  it("triggers file dialog when input is clicked", () => {
    render(<FileSelector label="Upload files" />);

    const input = screen.getByLabelText("Upload files") as HTMLInputElement;
    const dialogMock = jest.fn();
    input.addEventListener("click", dialogMock);

    fireEvent.click(input);

    expect(dialogMock).toHaveBeenCalled();
  });

  it("calls onFilesSelected with selected files and renders file names", () => {
    const handleSelect = jest.fn();
    render(<FileSelector onFilesSelected={handleSelect} label="Upload" />);

    const input = screen.getByLabelText("Upload") as HTMLInputElement;
    const files = [
      new File(["hello"], "hello.txt", { type: "text/plain" }),
      new File(["world"], "world.txt", { type: "text/plain" }),
    ];

    fireEvent.change(input, { target: { files } });

    expect(handleSelect).toHaveBeenCalledWith(files);
    expect(screen.getByText("hello.txt")).toBeInTheDocument();
    expect(screen.getByText("world.txt")).toBeInTheDocument();
    expect(input.value).toBe(""); // cleared for reselecting the same file
  });

  it("respects the multiple prop", () => {
    const { rerender } = render(<FileSelector label="Upload" />);
    let input = screen.getByLabelText("Upload") as HTMLInputElement;
    expect(input.multiple).toBe(false);

    rerender(<FileSelector multiple label="Upload" />);
    input = screen.getByLabelText("Upload") as HTMLInputElement;
    expect(input.multiple).toBe(true);
  });
});
