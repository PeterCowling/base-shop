import React from "react";
import { fireEvent,render, screen } from "@testing-library/react";

import FileSelector from "../src/components/atoms/FileSelector";

function createFile(name: string, type = "text/plain") {
  return new File(["content"], name, { type });
}

describe("FileSelector", () => {
  it("selects single and multiple files and lists names", () => {
    const onFilesSelected = jest.fn();
    const { rerender } = render(<FileSelector onFilesSelected={onFilesSelected} />);
    const input = screen.getByTestId("file-input") as HTMLInputElement;
    const file = createFile("a.txt");
    fireEvent.change(input, { target: { files: [file] } });
    expect(onFilesSelected).toHaveBeenCalledWith([file]);
    expect(screen.getByText("a.txt")).toBeInTheDocument();

    rerender(<FileSelector onFilesSelected={onFilesSelected} multiple />);
    const input2 = screen.getByTestId("file-input") as HTMLInputElement;
    const file2 = createFile("b.txt");
    fireEvent.change(input2, { target: { files: [file, file2] } });
    expect(onFilesSelected).toHaveBeenLastCalledWith([file, file2]);
    expect(screen.getByText("b.txt")).toBeInTheDocument();
  });
});

