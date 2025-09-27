import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FileSelector } from "../atoms/FileSelector";
import ThemeToggle from "../ThemeToggle";
import { Tag } from "../atoms/Tag";

let setThemeMock: jest.Mock;

jest.mock(
  "@platform-core/contexts/ThemeContext",
  () => {
    const React = require("react");
    setThemeMock = jest.fn();
    return {
      useTheme: () => {
        const [theme, setThemeState] = React.useState("base");
        const setTheme = (t: string) => {
          setThemeMock(t);
          setThemeState(t);
        };
        return { theme, setTheme };
      },
    };
  },
  { virtual: true }
);

describe("atoms interactions", () => {
  it("handles file selection and clearing", () => {
    const handleSelect = jest.fn();
    render(<FileSelector onFilesSelected={handleSelect} />);
    const input = screen.getByTestId("file-input") as HTMLInputElement;
    const file = new File(["hi"], "hi.txt", { type: "text/plain" });

    fireEvent.change(input, { target: { files: [file] } });
    expect(handleSelect).toHaveBeenCalledWith([file]);
    expect(screen.getByText("hi.txt")).toBeInTheDocument();

    fireEvent.change(input, { target: { files: [] } });
    expect(handleSelect).toHaveBeenLastCalledWith([]);
    expect(screen.queryByText("hi.txt")).not.toBeInTheDocument();
  });

  it("switches theme from light to dark", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    const button = screen.getByRole("button", { name: /switch to dark theme/i });
    expect(screen.getByText(/light theme selected/i)).toBeInTheDocument();

    await user.click(button);

    expect(setThemeMock).toHaveBeenCalledWith("dark");
    expect(screen.getByText(/dark theme selected/i)).toBeInTheDocument();
  });

  it("calls callback when tag is clicked", () => {
    const handleClose = jest.fn();
    render(
      <Tag onClick={handleClose} role="button">
        Close me
      </Tag>
    );

    fireEvent.click(screen.getByRole("button", { name: /close me/i }));
    expect(handleClose).toHaveBeenCalled();
  });
});
