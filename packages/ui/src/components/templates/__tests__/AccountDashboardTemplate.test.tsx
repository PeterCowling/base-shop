import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";

import { AccountDashboardTemplate } from "../AccountDashboardTemplate";

jest.mock("../../organisms/StatsGrid", () => ({
  StatsGrid: (props: any) => (
    <div data-cy="stats-grid">{JSON.stringify(props)}</div>
  ),
}));

jest.mock("../../organisms/DataTable", () => ({
  DataTable: (props: any) => (
    <div data-cy="data-table">{JSON.stringify(props)}</div>
  ),
}));

jest.mock("../../atoms/Avatar", () => ({
  Avatar: (props: any) => (
    <div data-cy="avatar">{JSON.stringify(props)}</div>
  ),
}));

const user = {
  name: "Jane Doe",
  email: "jane@example.com",
  avatar: "/avatar.jpg",
};

const stats = [{ label: "Orders", value: 5 }];

const orders = [{ id: "1" }];
const columns = [{ header: "ID", render: (row: { id: string }) => row.id }];

describe("AccountDashboardTemplate", () => {
  it("renders user info and passes data to children", () => {
    render(
      <AccountDashboardTemplate
        user={user}
        stats={stats}
        orders={orders}
        orderColumns={columns}
      />
    );

    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("jane@example.com")).toBeInTheDocument();

    const statsGrid = screen.getByTestId("stats-grid");
    expect(statsGrid.textContent).toContain(JSON.stringify({ items: stats }));

    const dataTable = screen.getByTestId("data-table");
    expect(dataTable.textContent).toContain(
      JSON.stringify({ rows: orders, columns })
    );
  });
});
