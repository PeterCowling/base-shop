/** @jest-environment jsdom */
import type { ReactElement } from "react";

jest.mock("next/navigation", () => ({ notFound: jest.fn(() => { throw new Error('not-found'); }) }));
jest.mock("../src/app/preview/[pageId]/PreviewClient", () => ({
  __esModule: true,
  default: (props: any) => <div data-cy="preview" data-props={JSON.stringify(props)} />,
}));

jest.mock("@ui/utils/devicePresets", () => ({
  devicePresets: [{ id: "D0" }, { id: "D1" }],
  getLegacyPreset: (k: "desktop" | "tablet" | "mobile") => ({ id: `LEGACY_${k}` }),
}));

describe("preview/[pageId]/page", () => {
  const makePage = () => ({
    id: "p1",
    slug: "p1",
    status: "draft",
    components: [],
    seo: { title: { en: "Title" } },
    createdAt: "2020-01-01",
    updatedAt: "2020-01-01",
    createdBy: "test",
  });

  beforeEach(() => {
    (global as any).fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("calls notFound on 404", async () => {
    (fetch as jest.Mock).mockResolvedValue({ status: 404, ok: false });
    const { default: Page } = await import("../src/app/preview/[pageId]/page");
    const { notFound } = await import("next/navigation");
    await expect(
      Page({ params: Promise.resolve({ pageId: "x" }), searchParams: Promise.resolve({}) })
    ).rejects.toThrow('not-found');
    expect((notFound as jest.Mock)).toHaveBeenCalled();
  });

  it("returns a 401 Response when unauthorized", async () => {
    (fetch as jest.Mock).mockResolvedValue({ status: 401, ok: false, json: async () => ({}) });
    const { default: Page } = await import("../src/app/preview/[pageId]/page");
    const res = (await Page({
      params: Promise.resolve({ pageId: "x" }),
      searchParams: Promise.resolve({ token: "bad" }),
    })) as Response;
    expect(res).toBeInstanceOf(Response);
    expect(res.status).toBe(401);
  });

  it("renders PreviewClient with initialDeviceId derived from legacy preset", async () => {
    (fetch as jest.Mock).mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => makePage(),
    });
    const { default: Page } = await import("../src/app/preview/[pageId]/page");
    const ui = (await Page({
      params: Promise.resolve({ pageId: "p1" }),
      searchParams: Promise.resolve({ device: "mobile" }),
    })) as ReactElement;
    // Render and access serialized props from the stubbed PreviewClient
    const { render, screen } = await import("@testing-library/react");
    render(ui);
    const el = screen.getByTestId('preview');
    const props = JSON.parse(el.getAttribute('data-props')!);
    expect(props.initialDeviceId).toBe("LEGACY_mobile");
    expect(props.components).toEqual([]);
  });

  it("uses preset id when provided as device param", async () => {
    (fetch as jest.Mock).mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => makePage(),
    });
    const { default: Page } = await import("../src/app/preview/[pageId]/page");
    const ui = (await Page({
      params: Promise.resolve({ pageId: "p1" }),
      searchParams: Promise.resolve({ device: "D1" }),
    })) as ReactElement;
    const { render, screen } = await import("@testing-library/react");
    render(ui);
    const el = screen.getByTestId('preview');
    const props = JSON.parse(el.getAttribute('data-props')!);
    expect(props.initialDeviceId).toBe("D1");
  });

  it("falls back to first preset on unknown device/view", async () => {
    (fetch as jest.Mock).mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => makePage(),
    });
    const { default: Page } = await import("../src/app/preview/[pageId]/page");
    const ui = (await Page({
      params: Promise.resolve({ pageId: "p1" }),
      searchParams: Promise.resolve({ device: "UNKNOWN" }),
    })) as ReactElement;
    const { render, screen } = await import("@testing-library/react");
    render(ui);
    const el = screen.getByTestId('preview');
    const props = JSON.parse(el.getAttribute('data-props')!);
    expect(props.initialDeviceId).toBe("D0");
  });
});
