import React, { type FC, type ReactElement } from "react";

import { getLegacyPreset } from "@acme/ui/utils/devicePresets";

import PreviewPage from "./page";

const notFound = jest.fn();
jest.mock("next/navigation", () => ({ notFound: () => notFound() }));

type PreviewClientProps = { initialDeviceId?: string } & Record<string, unknown>;

jest.mock("./PreviewClient", () => {
  const MockPreviewClient: FC<PreviewClientProps> = (props) => (
    <div data-cy="preview-client" {...props} />
  );
  MockPreviewClient.displayName = "MockPreviewClient";
  return MockPreviewClient;
});

jest.mock("@acme/ui/utils/devicePresets", () => ({
  devicePresets: [
    { id: "preset1", label: "Preset 1", width: 100, height: 200 },
    { id: "preset2", label: "Preset 2", width: 300, height: 400 },
  ],
  getLegacyPreset: jest.fn((view: string) => ({ id: `${view}-id` })),
}));

jest.mock("@acme/types", () => ({
  pageSchema: { parse: (data: unknown) => data },
}));

afterEach(() => {
  (global.fetch as unknown as jest.Mock | undefined)?.mockReset?.();
  notFound.mockClear();
  (getLegacyPreset as jest.Mock).mockClear();
});

describe("PreviewPage", () => {
  const baseParams = {
    params: { pageId: "1" },
    searchParams: {},
  } as Parameters<typeof PreviewPage>[0];
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
    const element = (await PreviewPage({
      ...baseParams,
      searchParams: { device: "preset2" },
    })) as ReactElement<PreviewClientProps>;
    expect(element.props.initialDeviceId).toBe("preset2");
  });

  it("uses view search param for legacy presets", async () => {
    global.fetch = jest.fn().mockResolvedValue(makeSuccess());
    const element = (await PreviewPage({
      ...baseParams,
      searchParams: { view: "mobile" },
    })) as ReactElement<PreviewClientProps>;
    expect(getLegacyPreset).toHaveBeenCalledWith("mobile");
    expect(element.props.initialDeviceId).toBe("mobile-id");
  });
});
