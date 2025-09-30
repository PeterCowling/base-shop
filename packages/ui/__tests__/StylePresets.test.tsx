import { render, screen, fireEvent } from "@testing-library/react";
import Presets from "../src/components/cms/style/Presets";
import presetData from "../src/components/cms/style/presets.json";

jest.mock("@acme/i18n", () => ({
  useTranslations: () => (key: string) => key,
}));

test("applies selected preset and can revert to defaults", async () => {
  const handleChange = jest.fn();
  const initial = { "--font-sans": "system" } as Record<string, string>;

  render(<Presets tokens={initial} baseTokens={{}} onChange={handleChange} />);

  const select = await screen.findByTestId("preset-select");
  fireEvent.change(select, { target: { value: "dark" } });

  const dark = (presetData as any).find((p: any) => p.id === "dark")!.tokens;
  expect(handleChange).toHaveBeenLastCalledWith({ ...initial, ...dark });

  const reset = screen.getByTestId("preset-reset");
  fireEvent.click(reset);
  expect(handleChange).toHaveBeenLastCalledWith({});
});
