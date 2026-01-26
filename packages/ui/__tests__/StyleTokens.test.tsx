import { fireEvent, render, screen } from "@testing-library/react";

import Tokens from "../src/components/cms/style/Tokens";

jest.mock("../src/hooks/useTokenEditor", () => ({ useTokenEditor: jest.fn() }));
jest.mock("../src/components/cms/index", () => ({
  ColorInput: ({ value, onChange }: any) => (
    <input value={value} onChange={(e) => onChange(e.target.value)} />
  ),
  FontSelect: () => null,
  RangeInput: () => null,
  getContrast: () => 5,
  suggestContrastColor: () => "",
}));

test("updates token via setToken", () => {
  const { useTokenEditor } = jest.requireMock(
    "../src/hooks/useTokenEditor"
  ) as { useTokenEditor: jest.Mock };
  const setToken = jest.fn();
  useTokenEditor.mockReturnValue({
     
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
