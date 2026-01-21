import "@testing-library/jest-dom";

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";

import type { ReturnAuthorization } from "@acme/types";

import { RaDashboard } from "../src/app/cms/ra/RaDashboardClient";

jest.mock("@/components/atoms/shadcn", () => ({
  Button: ({ children, asChild, ...props }: any) =>
    asChild ? <span {...props}>{children}</span> : <button {...props}>{children}</button>,
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Input: ({ ...props }: any) => <input {...props} />,
}));

jest.mock("@acme/ui", () => ({
  Tag: ({ children, ...props }: any) => <span {...props}>{children}</span>,
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const sampleRas: ReturnAuthorization[] = [
  {
    raId: "RA-1",
    orderId: "O-1",
    status: "Pending review",
    inspectionNotes: "Awaiting inspection",
  },
  {
    raId: "RA-2",
    orderId: "O-2",
    status: "Approved",
    inspectionNotes: "Processed successfully",
  },
  {
    raId: "RA-3",
    orderId: "O-3",
    status: "Pending",
    inspectionNotes: "Fraud risk flagged",
  },
];

describe("RA dashboard", () => {
  it("filters cards via quick filter and updates live region", () => {
    render(<RaDashboard ras={sampleRas} error={null} />);

    expect(screen.getAllByTestId("ra-card")).toHaveLength(3);
    expect(screen.getByTestId("ra-announce")).toHaveTextContent(
      "Showing 3 of 3 return authorizations",
    );

    fireEvent.click(screen.getByRole("button", { name: /high risk/i }));

    const cards = screen.getAllByTestId("ra-card");
    expect(cards).toHaveLength(1);
    expect(cards[0]).toHaveTextContent("RA-3");
    expect(screen.getByTestId("ra-announce")).toHaveTextContent(
      "Showing 1 of 3 return authorizations",
    );
  });
});
