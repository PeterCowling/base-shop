import React from "react";
import { render, screen } from "@testing-library/react";

const STORAGE_KEY = "cms-configurator-progress";

jest.mock("@/components/atoms", () => ({ Button: () => null }), {
  virtual: true,
});
jest.mock("@/components/cms/blocks", () => ({ blockRegistry: {} }), {
  virtual: true,
});
jest.mock(
  "@/components/organisms",
  () => ({ Footer: () => null, Header: () => null, SideNav: () => null }),
  { virtual: true }
);
jest.mock(
  "@/components/templates/AppShell",
  () => ({ AppShell: ({ children }: any) => <div>{children}</div> }),
  { virtual: true }
);
jest.mock(
  "@/i18n/Translations",
  () => ({ __esModule: true, default: ({ children }: any) => <>{children}</> }),
  { virtual: true }
);
jest.mock("@i18n/en.json", () => ({}), { virtual: true });
jest.mock(
  "@ui/utils/devicePresets",
  () => ({ devicePresets: [{ id: "d", type: "desktop", width: 100, height: 100 }] }),
  { virtual: true }
);
jest.mock("@ui/components/common/DeviceSelector", () => ({ __esModule: true, default: () => null }), {
  virtual: true,
});
jest.mock("@radix-ui/react-icons", () => ({ ReloadIcon: () => null }), {
  virtual: true,
});
jest.mock("@ui/hooks", () => ({ usePreviewDevice: () => ["d", jest.fn()] }), {
  virtual: true,
});
jest.mock("@platform-core/themeTokens", () => ({
  baseTokens: {},
  loadThemeTokensBrowser: () => ({}),
}), { virtual: true });

// eslint-disable-next-line @typescript-eslint/no-var-requires
const WizardPreview = require("../src/app/cms/wizard/WizardPreview").default;

describe("WizardPreview sanitization", () => {
  afterEach(() => {
    localStorage.removeItem(STORAGE_KEY);
  });

  it("sanitizes text block HTML", async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        components: [
          {
            id: "1",
            type: "Text",
            text: '<img alt="malicious" src="x" onerror="alert(1)" />',
          },
        ],
      })
    );

    render(<WizardPreview style={{}} />);

    const img = await screen.findByAltText("malicious");
    expect(img).toBeInTheDocument();
    expect(img).not.toHaveAttribute("onerror");
  });
});

