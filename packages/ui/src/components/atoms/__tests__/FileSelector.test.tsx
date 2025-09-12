import "../../../../../../test/resetNextMocks";
import { fireEvent, render, screen, configure } from "@testing-library/react";
import { FileSelector } from "../FileSelector";

configure({ testIdAttribute: "data-testid" });

describe("FileSelector", () => {
  it("triggers file dialog when input is clicked", () => {
    render(<FileSelector />);

    const input = screen.getByTestId("file-input") as HTMLInputElement;
    const dialogMock = jest.fn();
    input.addEventListener("click", dialogMock);

    fireEvent.click(input);

    expect(dialogMock).toHaveBeenCalled();
  });

  it("calls onFilesSelected with selected files and renders file names", () => {
    const handleSelect = jest.fn();
    render(<FileSelector onFilesSelected={handleSelect} />);

    const input = screen.getByTestId("file-input") as HTMLInputElement;
    const files = [
      new File(["hello"], "hello.txt", { type: "text/plain" }),
      new File(["world"], "world.txt", { type: "text/plain" }),
    ];

    fireEvent.change(input, { target: { files } });

    expect(handleSelect).toHaveBeenCalledWith(files);
    expect(screen.getByText("hello.txt")).toBeInTheDocument();
    expect(screen.getByText("world.txt")).toBeInTheDocument();
  });

  it("respects the multiple prop", () => {
    const { rerender } = render(<FileSelector />);
    let input = screen.getByTestId("file-input") as HTMLInputElement;
    expect(input.multiple).toBe(false);

    rerender(<FileSelector multiple />);
    input = screen.getByTestId("file-input") as HTMLInputElement;
    expect(input.multiple).toBe(true);
  });
});

