import { render } from "@testing-library/react";
import type { TokenMap } from "../../../hooks/useTokenEditor";
import StyleEditor from "../StyleEditor";

jest.mock("../style/Presets", () => jest.fn(() => null));
jest.mock("../style/Tokens", () => jest.fn(() => null));

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

    render(<StyleEditor {...props} />);

    expect(MockPresets).toHaveBeenCalledWith(props, undefined);
    expect(MockTokens).toHaveBeenCalledWith(props, undefined);
  });
});
