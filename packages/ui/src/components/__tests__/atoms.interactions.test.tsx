import "@testing-library/jest-dom";

import { fireEvent,render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { FileSelector } from "../atoms/FileSelector";
import { Tag } from "../atoms/Tag";
import ThemeToggle from "../ThemeToggle";

let setThemeMock: jest.Mock | undefined;

const ensureSetThemeMock = () => {
  if (!setThemeMock) {
    setThemeMock = jest.fn();
  }

  return setThemeMock;
};

jest.mock(
  "@acme/platform-core/contexts/ThemeContext",
  () => {
    const React = require("react");
    return {
      useTheme: () => {
        const [theme, setThemeState] = React.useState("base");
        const setTheme = (t: string) => {
          ensureSetThemeMock()(t);
          setThemeState(t);
        };
        return { theme, setTheme };
      },
    };
  },
  { virtual: true }
);

const getSetThemeMock = () => ensureSetThemeMock();

beforeEach(() => {
  if (setThemeMock) {
    setThemeMock.mockReset();
  }
});

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

    expect(getSetThemeMock()).toHaveBeenCalledWith("dark");
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
