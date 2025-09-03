import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { act } from "react";
import EmailMarketingPage from "../src/app/cms/marketing/email/page";

jest.mock(
  "@acme/email-templates",
  () => ({
    marketingEmailTemplates: [
      {
        id: "basic",
        label: "Basic",
        buildSubject: (h: string) => h,
        make: ({ headline, content }: any) => (
          <div>
            <h1>{headline}</h1>
            {content}
          </div>
        ),
      },
    ],
  }),
  { virtual: true }
);

describe("EmailMarketingPage form", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("shows success message on valid submit", async () => {
    const fetchMock = jest.fn((url: RequestInfo, options?: RequestInit) => {
      if (
        typeof url === "string" &&
        url.startsWith("/api/marketing/email") &&
        options?.method === "POST"
      ) {
        return Promise.resolve({ ok: true, json: async () => ({}) }) as any;
      }
      return Promise.resolve({ ok: true, json: async () => ({ segments: [], campaigns: [] }) }) as any;
    });
    // @ts-expect-error assign global fetch for jsdom
    global.fetch = fetchMock;
    // @ts-expect-error assign window fetch
    window.fetch = fetchMock;

    render(<EmailMarketingPage />);

    fireEvent.change(screen.getByPlaceholderText("Shop"), {
      target: { value: "s1" },
    });
    fireEvent.change(screen.getByPlaceholderText("Recipients (comma separated)"), {
      target: { value: "a@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Subject"), {
      target: { value: "Hello" },
    });
    fireEvent.change(screen.getByPlaceholderText("HTML body"), {
      target: { value: "<p>Hi</p>" },
    });

    await act(async () => {
      fireEvent.click(screen.getByText("Send"));
    });

    await screen.findByText("Queued");

    const postCall = fetchMock.mock.calls.find(
      ([url, options]) =>
        typeof url === "string" &&
        url === "/api/marketing/email" &&
        options?.method === "POST"
    );
    expect(postCall).toBeTruthy();
    const body = JSON.parse(postCall![1]!.body as string);
    expect(body).toMatchObject({
      shop: "s1",
      subject: "Hello",
      body: "<p>Hi</p>",
      templateId: "basic",
      recipients: ["a@example.com"],
      segment: "",
    });
  });

  it("shows failure message when API returns error", async () => {
    const fetchMock = jest.fn((url: RequestInfo, options?: RequestInit) => {
      if (
        typeof url === "string" &&
        url.startsWith("/api/marketing/email") &&
        options?.method === "POST"
      ) {
        return Promise.resolve({ ok: false, status: 400 }) as any;
      }
      return Promise.resolve({ ok: true, json: async () => ({ segments: [], campaigns: [] }) }) as any;
    });
    // @ts-expect-error assign global fetch for jsdom
    global.fetch = fetchMock;
    // @ts-expect-error assign window fetch
    window.fetch = fetchMock;

    render(<EmailMarketingPage />);

    fireEvent.change(screen.getByPlaceholderText("Shop"), {
      target: { value: "s1" },
    });
    // leave subject and recipients empty to trigger validation error
    await act(async () => {
      fireEvent.click(screen.getByText("Send"));
    });

    await screen.findByText("Failed");
  });
});
