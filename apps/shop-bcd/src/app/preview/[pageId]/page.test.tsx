import React from "react";

const notFound = jest.fn();
jest.mock("next/navigation", () => ({ notFound: () => notFound() }));

jest.mock("./PreviewClient", () => {
  const MockPreviewClient = (props: any) => <div data-cy="preview-client" {...props} />;
  MockPreviewClient.displayName = "MockPreviewClient";
  return MockPreviewClient;
});

jest.mock("@ui/utils/devicePresets", () => ({
  devicePresets: [
    { id: "preset1", label: "Preset 1", width: 100, height: 200 },
    { id: "preset2", label: "Preset 2", width: 300, height: 400 },
  ],
  getLegacyPreset: jest.fn((view: string) => ({ id: `${view}-id` })),
}));

import PreviewPage from "./page";
import { getLegacyPreset } from "@ui/utils/devicePresets";

jest.mock("@acme/types", () => ({
  pageSchema: { parse: (data: any) => data },
}));

afterEach(() => {
  (global.fetch as any)?.mockReset?.();
  notFound.mockClear();
  (getLegacyPreset as jest.Mock).mockClear();
});

describe("PreviewPage", () => {
  const baseParams = { params: { pageId: "1" }, searchParams: {} } as any;
  const makeSuccess = () =>
    new Response(
      JSON.stringify({ components: [], seo: { title: { en: "T" } } }),
      { status: 200 },
    );

  it("calls notFound on 404", async () => {
    global.fetch = jest.fn().mockResolvedValue(new Response(null, { status: 404 }));
    await expect(PreviewPage(baseParams)).rejects.toThrow("Failed to load preview");
    expect(notFound).toHaveBeenCalled();
  });

  it("returns 401 response when unauthorized", async () => {
    global.fetch = jest.fn().mockResolvedValue(new Response(null, { status: 401 }));
    const res = (await PreviewPage(baseParams)) as Response;
    expect(res.status).toBe(401);
  });

  it("throws on other error statuses", async () => {
    global.fetch = jest.fn().mockResolvedValue(new Response(null, { status: 500 }));
    await expect(PreviewPage(baseParams)).rejects.toThrow("Failed to load preview");
  });

  it("uses device search param for initialDeviceId", async () => {
    global.fetch = jest.fn().mockResolvedValue(makeSuccess());
    const element: any = await PreviewPage({
      ...baseParams,
      searchParams: { device: "preset2" },
    });
    expect(element.props.initialDeviceId).toBe("preset2");
  });

  it("uses view search param for legacy presets", async () => {
    global.fetch = jest.fn().mockResolvedValue(makeSuccess());
    const element: any = await PreviewPage({
      ...baseParams,
      searchParams: { view: "mobile" },
    });
    expect(getLegacyPreset).toHaveBeenCalledWith("mobile");
    expect(element.props.initialDeviceId).toBe("mobile-id");
  });
});
