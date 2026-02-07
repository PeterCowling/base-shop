import { fireEvent, render, screen } from "@testing-library/react";

import { TranslationsProvider } from "@acme/i18n";
import en from "@acme/i18n/en.json";

import CountdownTimerEditor from "../CountdownTimerEditor";

const handleInput = jest.fn();
jest.mock("../useComponentInputs", () => ({
  __esModule: true,
  default: () => ({ handleInput }),
}));

describe("CountdownTimerEditor", () => {
  afterEach(() => {
    handleInput.mockClear();
  });

  it.each([
    ["Target Date", "targetDate", "2025-01-01T00:00"],
    ["Timezone", "timezone", "UTC"],
    ["Completion Text", "completionText", "Done"],
    ["Styles", "styles", "text-lg"],
  ])("calls handleInput for %s changes", (label, field, value) => {
    const component: any = {
      type: "CountdownTimer",
      targetDate: "",
      timezone: "",
      completionText: "",
      styles: "",
    };

    const onChange = jest.fn();
    render(
      <TranslationsProvider messages={en}>
        <CountdownTimerEditor component={component} onChange={onChange} />
      </TranslationsProvider>
    );

    const input = screen.getByLabelText(label);
    fireEvent.change(input, { target: { value } });
    expect(handleInput).toHaveBeenCalledWith(field, value);
  });
});
