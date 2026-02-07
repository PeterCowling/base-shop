import React from "react";
import { fireEvent,render, screen } from "@testing-library/react";

import Repeater from "../Repeater";

// Minimal DataContext mocks
jest.mock("../../data/DataContext", () => {
  const React = require("react");
  const Ctx = React.createContext([] as any[]);
  const StateCtx = React.createContext("ready" as string);
  return {
    __esModule: true,
    useDataset: () => React.useContext(Ctx),
    useDatasetState: () => React.useContext(StateCtx),
    ItemProvider: ({ item, index, children }: any) => <div data-item={index}>{children}</div>,
    DatasetProvider: ({ items, state = "ready", children }: any) => (
      <StateCtx.Provider value={state}><Ctx.Provider value={items}>{children}</Ctx.Provider></StateCtx.Provider>
    ),
  };
});

describe("Repeater", () => {
  const items = [
    { id: 1, title: "A", status: "published", score: 2 },
    { id: 2, title: "B", status: "draft", score: 10 },
    { id: 3, title: "C", status: "published", score: 5 },
  ];

  it("filters, sorts, limits and loads more", () => {
    const { DatasetProvider } = jest.requireMock("../../data/DataContext");
    render(
      <DatasetProvider items={items}>
        <Repeater filter="status=published" sortBy="score" sortOrder="desc" initialCount={1} increment={1} columns={2}>
          <div>Item</div>
        </Repeater>
      </DatasetProvider>
    );
    // initial renders one
    expect(screen.getAllByText("Item").length).toBe(1);
    // load more
    fireEvent.click(screen.getByRole("button", { name: "Load more" }));
    expect(screen.getAllByText("Item").length).toBe(2);
  });

  it("respects responsive columns/gap via pbViewport", () => {
    const { DatasetProvider } = jest.requireMock("../../data/DataContext");
    const { container, rerender } = render(
      <DatasetProvider items={items}>
        <Repeater columns={1} columnsDesktop={4} pbViewport="desktop" gap="8px" gapDesktop="16px">
          <div>Item</div>
        </Repeater>
      </DatasetProvider>
    );
    const grid = container.querySelector("div[style]") as HTMLElement;
    expect(grid.style.gap).toBe("16px");
    expect(grid.style.gridTemplateColumns).toMatch(/repeat\(4/);
    // mobile fallback
    rerender(
      <DatasetProvider items={items}>
        <Repeater columns={1} columnsMobile={2} pbViewport="mobile" gapMobile="4px">
          <div>Item</div>
        </Repeater>
      </DatasetProvider>
    );
    const grid2 = container.querySelector("div[style]") as HTMLElement;
    expect(grid2.style.gap).toBe("4px");
    expect(grid2.style.gridTemplateColumns).toMatch(/repeat\(2/);
  });

  it("shows states based on dataset state and empties", () => {
    const { DatasetProvider } = jest.requireMock("../../data/DataContext");
    const Loading = () => <div>Loading…</div>;
    const Empty = () => <div>Nothing</div>;
    const ErrorView = () => <div>Error!</div>;

    const { rerender } = render(
      <DatasetProvider items={[]} state="ready">
        <Repeater LoadingState={Loading} EmptyState={Empty} ErrorState={ErrorView}>
          <div>Item</div>
        </Repeater>
      </DatasetProvider>
    );
    expect(screen.getByText("Nothing")).toBeInTheDocument();

    rerender(
      <DatasetProvider items={[]} state="loading">
        <Repeater LoadingState={Loading} EmptyState={Empty} ErrorState={ErrorView}>
          <div>Item</div>
        </Repeater>
      </DatasetProvider>
    );
    expect(screen.getByText("Loading…")).toBeInTheDocument();

    rerender(
      <DatasetProvider items={[]} state="error">
        <Repeater LoadingState={Loading} EmptyState={Empty} ErrorState={ErrorView}>
          <div>Item</div>
        </Repeater>
      </DatasetProvider>
    );
    expect(screen.getByText("Error!")).toBeInTheDocument();
  });
});

