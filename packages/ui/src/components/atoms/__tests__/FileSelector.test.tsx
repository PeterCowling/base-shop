import "../../../../../../test/resetNextMocks";
import { fireEvent, render, screen } from "@testing-library/react";
import { FileSelector } from "../FileSelector";

describe("FileSelector", () => {
  it("invokes callback and displays selected file names", () => {
    const handleSelect = jest.fn();
    render(<FileSelector onFilesSelected={handleSelect} />);

    const input = screen.getByTestId("file-input") as HTMLInputElement;
    const file = new File(["hello"], "hello.txt", { type: "text/plain" });

    fireEvent.change(input, { target: { files: [file] } });

    expect(handleSelect).toHaveBeenCalledTimes(1);
    expect(handleSelect).toHaveBeenCalledWith([file]);
    expect(screen.getByText("hello.txt")).toBeInTheDocument();
  });
});
