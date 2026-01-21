import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import PluginsPage from "../src/app/cms/plugins/page";

jest.mock("@acme/platform-core/plugins", () => ({
  loadPlugins: jest.fn(),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: { children: any; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("PluginsPage", () => {
  it("toggles plugin config textarea and updates state", async () => {
    const samplePlugins = [
      { id: "p1", name: "Test Plugin", defaultConfig: { foo: "bar" } },
    ];
    const { loadPlugins } = require("@acme/platform-core/plugins");
    loadPlugins.mockResolvedValue(samplePlugins);

    render(await PluginsPage());

    const user = userEvent.setup();

    const checkbox = screen.getByRole("checkbox", { name: "Test Plugin" });
    expect(screen.queryByRole("textbox")).toBeNull();

    await user.click(checkbox);
    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveValue(
      JSON.stringify(samplePlugins[0].defaultConfig, null, 2)
    );

    await user.clear(textarea);
    await user.type(textarea, "updated");
    expect(textarea).toHaveValue("updated");

    await user.click(checkbox);
    expect(screen.queryByRole("textbox")).toBeNull();
  });
});
