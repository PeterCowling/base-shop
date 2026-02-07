/**
 * Hydration test for preview guide mode
 *
 * Validates that PreviewBanner does not cause hydration mismatches when
 * search params differ between SSR and client (the verified root cause).
 *
 * This test targets the core mismatch: server sees search="", client sees search="?preview=token".
 */

import React from "react";

import PreviewBanner from "@/routes/guides/guide-seo/components/PreviewBanner";
import { expectNoHydrationErrors, renderWithHydration } from "@/test/helpers/hydrationTestUtils";

// Mock PREVIEW_TOKEN for test environment
jest.mock("@/config/env", () => ({
  ...jest.requireActual("@/config/env"),
  PREVIEW_TOKEN: "test-token",
}));

describe("preview guide hydration", () => {
  it("does not cause hydration errors when search param differs between server and client", () => {
    // Simulate the exact scenario that caused the reported error:
    // - Server: search="" (banner not eligible, returns null)
    // - Client: search="?preview=test-token" (banner eligible, might render div)
    //
    // After TASK-03 fix, PreviewBanner should be structurally hydration-safe

    const ServerBanner = () => (
      <PreviewBanner guideKey="rules" search="" label="Preview Mode" />
    );

    const ClientBanner = () => (
      <PreviewBanner guideKey="rules" search="?preview=test-token" label="Preview Mode" />
    );

    const result = renderWithHydration({
      server: <ServerBanner />,
      client: <ClientBanner />,
    });

    // After TASK-03, there should be no structural hydration errors
    // Before TASK-03, this will fail (expected - validates test works)
    expectNoHydrationErrors(result);
  });

  it("renders banner content correctly after hydration when eligible", () => {
    // When banner is eligible on both server and client, it should render consistently
    const BannerBoth = () => (
      <PreviewBanner guideKey="rules" search="?preview=test-token" label="Preview Mode" />
    );

    const result = renderWithHydration({
      server: <BannerBoth />,
      client: <BannerBoth />,
    });

    expect(result.hydrationErrors).toEqual([]);
    // Banner should be present in server HTML
    expect(result.serverHTML).toContain("Preview Mode");
    // And also in client DOM after hydration
    expect(result.container.textContent).toContain("Preview Mode");
  });

  it("handles banner not eligible on both server and client", () => {
    // When banner is not eligible on either side, should be consistent
    const NoBanner = () => (
      <PreviewBanner guideKey="rules" search="" label="Preview Mode" />
    );

    const result = renderWithHydration({
      server: <NoBanner />,
      client: <NoBanner />,
    });

    expect(result.hydrationErrors).toEqual([]);
    // Banner should not be present (returns null)
    expect(result.serverHTML).not.toContain("Preview Mode");
  });
});
