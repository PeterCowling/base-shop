import "@testing-library/jest-dom";

import type { ReactNode } from "react";
import { act } from "react";
import { render, screen } from "@testing-library/react";

import type { AggregatedOrder } from "../../../../types/bar/BarTypes";
import type { SelectCoffeeOrTeaModalProps } from "../modal/SelectCoffeeOrTeaModal";
import OrderTakingContainer from "../OrderTakingContainer";

// capture props passed to OrderTakingScreen so we can trigger callbacks
interface CapturedScreenProps {
  children?: ReactNode;
  onAddProduct: (name: string, price: number) => void;
  onRemoveItem: (product: string) => void;
  orders: AggregatedOrder[];
  totalPrice: number;
}

let capturedProps: CapturedScreenProps | null = null;
jest.mock("../OrderTakingScreen", () => ({
  __esModule: true,
  default: (props: CapturedScreenProps) => {
    capturedProps = props;
    return <div data-testid="screen">{props.children}</div>;
  },
}));

// capture props for SelectCoffeeOrTeaModal to simulate editing
let selectModalProps: SelectCoffeeOrTeaModalProps | null = null;
jest.mock("../modal/SelectCoffeeOrTeaModal", () => ({
  __esModule: true,
  default: (props: SelectCoffeeOrTeaModalProps) => {
    selectModalProps = props;
    return <div data-testid="select-modal" />;
  },
}));

// stub out other modal components
jest.mock("../modal/MixerModal", () => ({
  __esModule: true,
  default: () => <div data-testid="mixer-modal" />,
}));
jest.mock("../modal/WithMilkModal", () => ({
  __esModule: true,
  default: () => <div data-testid="with-milk-modal" />,
}));
jest.mock("../modal/IcedCoffeeSweetnessModal", () => ({
  __esModule: true,
  default: () => <div data-testid="iced-coffee-modal" />,
}));

// ----- mocks for hooks -----
jest.mock("../../../../context/AuthContext", () => ({
  useAuth: () => ({ user: { user_name: "tester" } }),
}));

const removeItemFromOrder = jest.fn();
const updateItemInOrder = jest.fn();
const addItemToOrder = jest.fn();
let mockOrderItems: AggregatedOrder[] = [];
let mockError: unknown = null;

jest.mock(
  "../../../../hooks/orchestrations/bar/actions/mutations/useBarOrder",
  () => ({
    useBarOrder: () => ({
      unconfirmedOrder: { items: mockOrderItems },
      removeItemFromOrder,
      clearOrder: jest.fn(),
      confirmOrder: jest.fn(),
      updateItemInOrder,
    }),
  })
);

jest.mock(
  "../../../../hooks/orchestrations/bar/actions/mutations/useAddItemToOrder",
  () => ({
    useAddItemToOrder: () => ({ addItemToOrder, error: mockError }),
  })
);

jest.mock("../../../../hooks/data/bar/useBleepersData", () => ({
  useBleepersData: () => ({
    bleepers: {},
    firstAvailableBleeper: 1,
    findNextAvailableBleeper: jest.fn(),
  }),
}));

jest.mock("../../../../hooks/mutations/useBleeperMutations", () => ({
  useBleeperMutations: () => ({ setBleeperAvailability: jest.fn() }),
}));

const getProductCategory2 = jest.fn((name: string) => {
  if (name === "Oat Milk") return "milkAddOn";
  if (name === "Latte" || name === "Espresso") return "coffee";
  return undefined;
});

jest.mock("../../../../hooks/data/bar/useProducts", () => ({
  useProducts: () => ({
    getProductsByCategory: jest.fn().mockReturnValue([]),
    getProductCategory2,
  }),
}));

// ----- tests -----
describe("OrderTakingContainer order flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedProps = null;
    selectModalProps = null;
    mockOrderItems = [];
    mockError = null;
  });

  it("handles empty orders", () => {
    render(<OrderTakingContainer menuType="nonalcoholic" />);
    const props = capturedProps;
    if (!props) throw new Error("props not captured");
    expect(props.orders).toEqual([]);
    expect(props.totalPrice).toBe(0);
  });

  it("adds and removes items", () => {
    mockOrderItems = [{ product: "Latte", price: 3, count: 1 }];
    render(<OrderTakingContainer menuType="nonalcoholic" />);
    const props = capturedProps;
    if (!props) throw new Error("props not captured");
    act(() => {
      props.onAddProduct("Cookie", 1.5);
    });
    expect(addItemToOrder).toHaveBeenCalledWith("Cookie", 1.5, "Bar");
    act(() => {
      props.onRemoveItem("Latte");
    });
    expect(removeItemFromOrder).toHaveBeenCalledWith("Latte");
  });

  it("edits an item via milk add-on selection", () => {
    mockOrderItems = [
      { product: "Latte", price: 3, count: 1 },
      { product: "Espresso", price: 2, count: 1 },
    ];
    render(<OrderTakingContainer menuType="nonalcoholic" />);
    const props = capturedProps;
    if (!props) throw new Error("props not captured");
    act(() => {
      props.onAddProduct("Oat Milk", 0.5);
    });
    expect(screen.getByTestId("select-modal")).toBeInTheDocument();
    act(() => {
      selectModalProps?.onSelectOrder("Latte");
    });
    expect(updateItemInOrder).toHaveBeenCalledWith(
      "Latte",
      "Latte + Oat Milk",
      3.5
    );
    expect(screen.queryByTestId("select-modal")).not.toBeInTheDocument();
  });

  it("handles invalid add inputs", () => {
    render(<OrderTakingContainer menuType="alcoholic" />);
    const props = capturedProps;
    if (!props) throw new Error("props not captured");
    act(() => {
      props.onAddProduct("", Number.NaN);
    });
    expect(addItemToOrder).toHaveBeenCalledWith("", Number.NaN, "Bar");
  });

  it("shows error banner when add fails", () => {
    mockError = new Error("boom");
    render(<OrderTakingContainer menuType="nonalcoholic" />);
    expect(screen.getByText(/Error adding item to order/i)).toBeInTheDocument();
  });
});

