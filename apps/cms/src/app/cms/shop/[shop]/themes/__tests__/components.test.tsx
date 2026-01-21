import type { ComponentProps } from "react";
import { fireEvent,render } from "@testing-library/react";

import PresetControls from "../PresetControls";
import ThemeSelector from "../ThemeSelector";

jest.mock(
  "@/components/atoms/shadcn",
  () => ({
    Button: (props: ComponentProps<"button">) => <button {...props} />,
    Input: (props: ComponentProps<"input">) => <input {...props} />,
  }),
  { virtual: true },
);

describe("ThemeSelector", () => {
  it("calls onChange when value changes", () => {
    const handleChange = jest.fn();
    const { getByLabelText } = render(
      <ThemeSelector themes={["base", "dark"]} value="base" onChange={handleChange} />,
    );
    fireEvent.change(getByLabelText("Theme"), { target: { value: "dark" } });
    expect(handleChange).toHaveBeenCalled();
  });
});

describe("PresetControls", () => {
  it("handles interactions", () => {
    const setName = jest.fn();
    const save = jest.fn();
    const del = jest.fn();
    const { getByPlaceholderText, getByText } = render(
      <PresetControls
        presetName="preset"
        setPresetName={setName}
        handleSavePreset={save}
        handleDeletePreset={del}
        isPresetTheme
      />,
    );
    fireEvent.change(getByPlaceholderText("Preset name"), {
      target: { value: "my" },
    });
    expect(setName).toHaveBeenCalledWith("my");
    fireEvent.click(getByText("Save Preset"));
    expect(save).toHaveBeenCalled();
    fireEvent.click(getByText("Delete Preset"));
    expect(del).toHaveBeenCalled();
  });
});
