import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import type { SalesOrder } from "../../../../types/bar/BarTypes";

import SalesScreen from "../SalesScreen";
import Ticket from "../Ticket";
import TicketItems from "../TicketItems";

// ---- Mocks ------------------------------------------------------------

let ordersMock: SalesOrder[] = [];

jest.mock("../../../../hooks/data/bar/useSalesOrders", () => ({
  useSalesOrders: () => ({ orders: ordersMock, loading: false, error: null }),
}));

jest.mock("../../../../hooks/orchestrations/bar/actions/mutations/useOrderActions", () => ({
  useOrderActions: () => ({
    removeItems: jest.fn(),
    removeSingleItem: jest.fn(),
  }),
}));

jest.mock("../../../../hooks/mutations/useBleeperMutations", () => ({
  useBleeperMutations: () => ({ setBleeperAvailability: jest.fn() }),
}));

jest.mock("../../../../services/useFirebase", () => ({
  useFirebaseDatabase: () => null,
}));

jest.mock("../../../../hooks/orchestrations/bar/actions/clientActions/useOrderAgeColor", () => ({
  useOrderAgeColor: () => "bg-test",
}));

// ----------------------------------------------------------------------

afterEach(() => {
  jest.restoreAllMocks();
});

describe("SalesScreen", () => {
  it("renders ticket list", () => {
    ordersMock = [
      {
        orderKey: "o1",
        confirmed: true,
        bleepNumber: "1",
        userName: "user",
        time: "09:00",
        paymentMethod: "cash",
        items: [{ product: "Tea", count: 1 }],
      },
      {
        orderKey: "o2",
        confirmed: true,
        bleepNumber: "2",
        userName: "user2",
        time: "10:00",
        paymentMethod: "cash",
        items: [{ product: "Coffee", count: 1 }],
      },
    ];
    const { container } = render(<SalesScreen />);
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(container.firstChild).toHaveClass(
      "dark:bg-darkBg",
      "dark:from-darkBg",
      "dark:via-darkBg",
      "dark:to-darkBg"
    );
  });
});

describe("Ticket", () => {
  const order: SalesOrder = {
    orderKey: "o1",
    confirmed: true,
    bleepNumber: "5",
    userName: "user",
    time: "12:00",
    paymentMethod: "cash",
    items: [
      { product: "Water", count: 1 },
      { product: "Beer", count: 2 },
    ],
  };

  it("shows header info and items", () => {
    const { container } = render(
      <Ticket
        order={order}
        filter="ALL"
        removeItems={jest.fn()}
        removeSingleItem={jest.fn()}
      />
    );
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("12:00")).toBeInTheDocument();
    expect(screen.getByText("Water")).toBeInTheDocument();
    expect(screen.getByText("2 × Beer")).toBeInTheDocument();
    expect(container.querySelector("article")).toHaveClass(
      "dark:bg-darkSurface",
      "dark:border-darkSurface"
    );
  });
});

describe("TicketItems", () => {
  const order: SalesOrder = {
    orderKey: "o1",
    confirmed: true,
    bleepNumber: "5",
    userName: "user",
    time: "12:00",
    paymentMethod: "cash",
    items: [
      { product: "Cola", count: 1 },
      { product: "Lemonade", count: 3 },
    ],
  };

  it("renders each item row", () => {
    render(<TicketItems order={order} removeSingleItem={jest.fn()} />);
    expect(screen.getByText("Cola")).toBeInTheDocument();
    expect(screen.getByText("3 × Lemonade")).toBeInTheDocument();
  });
});
