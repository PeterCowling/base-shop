/* i18n-exempt file -- TEST-0003: unit test literals are not user-facing */
/* eslint-disable ds/no-raw-color -- TEST-0003: passing raw hex to props is required for this unit test */
import { render, within } from "@testing-library/react";
import type { TokenMap } from "../../../hooks/useTokenEditor";
import StyleEditor from "../StyleEditor";

jest.mock("../style/Presets", () => jest.fn(() => <div>presets</div>));
jest.mock("../style/Tokens", () => jest.fn(() => <div>tokens</div>));

import Presets from "../style/Presets";
import Tokens from "../style/Tokens";

const MockPresets = Presets as unknown as jest.Mock;
const MockTokens = Tokens as unknown as jest.Mock;

describe("StyleEditor", () => {
  it("forwards props to Presets and Tokens", () => {
    const tokens: TokenMap = { "--color-primary": "#fff" };
    const baseTokens: TokenMap = { "--color-primary": "#000" };
    const onChange = jest.fn();
    const props = {
      tokens,
      baseTokens,
      onChange,
      focusToken: "--color-primary",
    };

    const { container } = render(<StyleEditor {...props} />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass("space-y-4");

    const scoped = within(wrapper);
    expect(scoped.getByText("presets")).toBeInTheDocument();
    expect(scoped.getByText("tokens")).toBeInTheDocument();

    expect(MockPresets).toHaveBeenCalledWith(props, undefined);
    expect(MockTokens).toHaveBeenCalledWith(props, undefined);
  });
});
