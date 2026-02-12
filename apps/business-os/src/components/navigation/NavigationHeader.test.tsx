/**
 * NavigationHeader Component Tests
 * BOS-UX-04, BOS-UX-15
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { User } from "@/lib/current-user";
import type { Business } from "@/lib/types";

import { NavigationHeader } from "./NavigationHeader";

// Mock Next.js router
jest.mock("next/navigation", () => ({
  usePathname: () => "/boards",
}));

const mockBusinesses: Business[] = [
  {
    id: "BRIK",
    name: "Brikette",
    description: "Retail operations",
    owner: "Pete",
    status: "active",
    created: "2025-01-01",
    tags: ["retail"],
  },
  {
    id: "CMS",
    name: "CMS Platform",
    description: "Content platform",
    owner: "Avery",
    status: "active",
    created: "2025-02-01",
    tags: ["platform"],
  },
];

const mockCurrentUser: User = {
  id: "pete",
  name: "Pete",
  email: "pete@business-os.local",
  role: "admin",
};

describe("NavigationHeader", () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockImplementation(() => new Promise(() => {}));
    (global as typeof globalThis & { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    fetchMock.mockReset();
  });

  it("renders all navigation links", () => {
    render(
      <NavigationHeader
        businesses={mockBusinesses}
        currentBusiness="BRIK"
        currentUser={mockCurrentUser}
      />
    );

    expect(screen.getByRole("link", { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /boards/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ideas/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /people/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /plans/i })).toBeInTheDocument();
  });

  it("highlights current route", () => {
    render(
      <NavigationHeader
        businesses={mockBusinesses}
        currentBusiness="BRIK"
        currentUser={mockCurrentUser}
      />
    );

    const boardsLink = screen.getByRole("link", { name: /boards/i });
    expect(boardsLink).toHaveAttribute("aria-current", "page");
  });

  it("renders business selector", () => {
    render(
      <NavigationHeader
        businesses={mockBusinesses}
        currentBusiness="BRIK"
        currentUser={mockCurrentUser}
      />
    );

    // BusinessSelector should show current business name
    expect(screen.getByText("Brikette")).toBeInTheDocument();
  });

  it("renders capture button", () => {
    render(
      <NavigationHeader
        businesses={mockBusinesses}
        currentBusiness="BRIK"
        currentUser={mockCurrentUser}
      />
    );

    const captureButton = screen.getByRole("button", { name: /capture/i });
    expect(captureButton).toBeInTheDocument();
  });

  it("opens modal when capture button clicked", async () => {
    const user = userEvent.setup();
    render(
      <NavigationHeader
        businesses={mockBusinesses}
        currentBusiness="BRIK"
        currentUser={mockCurrentUser}
      />
    );

    const captureButton = screen.getByRole("button", { name: /capture/i });
    await user.click(captureButton);

    // Modal should be open
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/quick capture/i)).toBeInTheDocument();
  });

  it("shows capture button on desktop only", () => {
    render(
      <NavigationHeader
        businesses={mockBusinesses}
        currentBusiness="BRIK"
        currentUser={mockCurrentUser}
      />
    );

    const captureButton = screen.getByRole("button", { name: /capture/i });
    // Parent container should have responsive class
    const parentContainer = captureButton.closest(".md\\:inline-flex");
    expect(parentContainer).toBeInTheDocument();
  });

  it("renders Healthy badge when automation status is healthy", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: "ok",
        automation: {
          lastSweepRunStatus: "complete",
          discoveryIndexStatus: "fresh",
        },
      }),
    });

    render(
      <NavigationHeader
        businesses={mockBusinesses}
        currentBusiness="BRIK"
        currentUser={mockCurrentUser}
      />
    );

    await waitFor(() => {
      expect(screen.getByLabelText("Automation status")).toHaveTextContent("Healthy");
    });
  });

  it("renders Attention badge when automation status is degraded", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: "degraded",
        automation: {
          lastSweepRunStatus: "partial",
          discoveryIndexStatus: "stale",
        },
      }),
    });

    render(
      <NavigationHeader
        businesses={mockBusinesses}
        currentBusiness="BRIK"
        currentUser={mockCurrentUser}
      />
    );

    await waitFor(() => {
      expect(screen.getByLabelText("Automation status")).toHaveTextContent("Attention");
    });
  });
});
