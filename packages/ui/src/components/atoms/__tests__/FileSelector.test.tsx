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

  it("passes selected files to callback", () => {
    const handleSelect = jest.fn();
    render(<FileSelector onFilesSelected={handleSelect} />);

    const input = screen.getByTestId("file-input") as HTMLInputElement;
    const file = new File(["hello"], "hello.txt", { type: "text/plain" });

    fireEvent.change(input, { target: { files: [file] } });

    expect(handleSelect).toHaveBeenCalledWith([file]);
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

