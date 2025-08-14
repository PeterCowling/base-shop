jest.mock("@ui/hooks/useTokenEditor", () => ({ useTokenEditor: jest.fn() }));
jest.mock("../src/components/cms/index", () => ({
  ColorInput: ({ value, onChange }: any) => (
    <input value={value} onChange={(e) => onChange(e.target.value)} />
  ),
  FontSelect: () => null,
  RangeInput: () => null,
  getContrast: () => 5,
  suggestContrastColor: () => "",
}));
import { useTokenEditor } from "@ui/hooks/useTokenEditor";
import { render, fireEvent, screen } from "@testing-library/react";
import Tokens from "../src/components/cms/style/Tokens";

const mockEditor = useTokenEditor as jest.MockedFunction<typeof useTokenEditor>;

test("updates token via setToken", () => {
  const setToken = jest.fn();
  mockEditor.mockReturnValue({
    colors: [{ key: "--color-bg", value: "#fff", defaultValue: "#fff", isOverridden: false }],
    fonts: [],
    others: [],
    sansFonts: [],
    monoFonts: [],
    googleFonts: [],
    newFont: "",
    setNewFont: jest.fn(),
    setToken,
    handleUpload: jest.fn(),
    addCustomFont: jest.fn(),
    setGoogleFont: jest.fn(),
  });
  render(<Tokens tokens={{}} baseTokens={{}} onChange={() => {}} />);
  fireEvent.change(screen.getByDisplayValue("#fff"), { target: { value: "#000" } });
  expect(setToken).toHaveBeenCalledWith("--color-bg", "#000");
});
