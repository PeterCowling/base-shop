import { render, screen } from "@testing-library/react";
import Presets from "../src/components/cms/style/Presets";

test("renders presets placeholder", () => {
  render(<Presets tokens={{}} baseTokens={{}} onChange={() => {}} />);
  expect(screen.getByTestId("presets-placeholder")).toBeInTheDocument();
});
