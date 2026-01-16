import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { act } from "react";
import type { ComponentProps } from "react";
import type { CategoryType } from "../../../../types/bar/BarTypes";
import OrderTakingContainer from "../OrderTakingContainer";
import type OrderTakingScreen from "../OrderTakingScreen";
import type MixerModal from "../modal/MixerModal";
import type WithMilkModal from "../modal/WithMilkModal";
import type IcedCoffeeSweetnessModal from "../modal/IcedCoffeeSweetnessModal";
import type SelectCoffeeOrTeaModal from "../modal/SelectCoffeeOrTeaModal";

type OrderTakingScreenProps = ComponentProps<typeof OrderTakingScreen>;
type MixerModalProps = ComponentProps<typeof MixerModal>;
type WithMilkModalProps = ComponentProps<typeof WithMilkModal>;
type IcedCoffeeSweetnessModalProps = ComponentProps<typeof IcedCoffeeSweetnessModal>;
type SelectCoffeeOrTeaModalProps = ComponentProps<typeof SelectCoffeeOrTeaModal>;

// captured props from rendered children
let capturedProps: OrderTakingScreenProps | null = null;
let mixerModalProps: MixerModalProps | null = null;
let milkModalProps: WithMilkModalProps | null = null;
let icedModalProps: IcedCoffeeSweetnessModalProps | null = null;
let selectBaseProps: SelectCoffeeOrTeaModalProps | null = null;

const getCapturedProps = (): OrderTakingScreenProps => {
  if (!capturedProps) throw new Error("capturedProps not set");
  return capturedProps;
};
const getMixerModalProps = (): MixerModalProps => {
  if (!mixerModalProps) throw new Error("mixerModalProps not set");
  return mixerModalProps;
};
const getMilkModalProps = (): WithMilkModalProps => {
  if (!milkModalProps) throw new Error("milkModalProps not set");
  return milkModalProps;
};
const getIcedModalProps = (): IcedCoffeeSweetnessModalProps => {
  if (!icedModalProps) throw new Error("icedModalProps not set");
  return icedModalProps;
};
const getSelectBaseProps = (): SelectCoffeeOrTeaModalProps => {
  if (!selectBaseProps) throw new Error("selectBaseProps not set");
  return selectBaseProps;
};

vi.mock("../OrderTakingScreen", () => ({
  __esModule: true,
  default: (props: OrderTakingScreenProps) => {
    capturedProps = props;
    return <div data-testid="screen">{props.children}</div>;
  },
}));

vi.mock("../modal/MixerModal", () => ({
  __esModule: true,
  default: (props: MixerModalProps) => {
    mixerModalProps = props;
    return null;
  },
}));

vi.mock("../modal/WithMilkModal", () => ({
  __esModule: true,
  default: (props: WithMilkModalProps) => {
    milkModalProps = props;
    return null;
  },
}));

vi.mock("../modal/IcedCoffeeSweetnessModal", () => ({
  __esModule: true,
  default: (props: IcedCoffeeSweetnessModalProps) => {
    icedModalProps = props;
    return null;
  },
}));

vi.mock("../modal/SelectCoffeeOrTeaModal", () => ({
  __esModule: true,
  default: (props: SelectCoffeeOrTeaModalProps) => {
    selectBaseProps = props;
    return null;
  },
}));

vi.mock("../../../../context/AuthContext", () => ({
  useAuth: () => ({ user: { user_name: "tester" } }),
}));

// hooks with mutable spies
let mockOrder: { items: { product: string; price: number }[] };
let removeItemFromOrder: ReturnType<typeof vi.fn>;
let clearOrder: ReturnType<typeof vi.fn>;
let confirmOrder: ReturnType<typeof vi.fn>;
let updateItemInOrder: ReturnType<typeof vi.fn>;
let addItemToOrderDb: ReturnType<typeof vi.fn>;
let addItemError: Error | null;
let bleepers: Record<number, boolean>;
let firstAvailableBleeper: number;
let findNextAvailableBleeper: ReturnType<typeof vi.fn>;
let setBleeperAvailability: ReturnType<typeof vi.fn>;
let getProductsByCategory: ReturnType<typeof vi.fn>;
let getSubCat: ReturnType<typeof vi.fn>;

vi.mock(
  "../../../../hooks/orchestrations/bar/actions/mutations/useBarOrder",
  () => ({
    useBarOrder: () => ({
      unconfirmedOrder: mockOrder,
      removeItemFromOrder,
      clearOrder,
      confirmOrder,
      updateItemInOrder,
    }),
  })
);

vi.mock(
  "../../../../hooks/orchestrations/bar/actions/mutations/useAddItemToOrder",
  () => ({
    useAddItemToOrder: () => ({ addItemToOrder: addItemToOrderDb, error: addItemError }),
  })
);

vi.mock("../../../../hooks/data/bar/useBleepersData", () => ({
  useBleepersData: () => ({
    bleepers,
    firstAvailableBleeper,
    findNextAvailableBleeper,
  }),
}));

vi.mock("../../../../hooks/mutations/useBleeperMutations", () => ({
  useBleeperMutations: () => ({ setBleeperAvailability }),
}));

vi.mock("../../../../hooks/data/bar/useProducts", () => ({
  useProducts: () => ({
    getProductsByCategory,
    getProductCategory2: getSubCat,
  }),
}));

beforeEach(() => {
  capturedProps = null;
  mixerModalProps = null;
  milkModalProps = null;
  icedModalProps = null;
  selectBaseProps = null;
  mockOrder = { items: [] };
  removeItemFromOrder = vi.fn();
  clearOrder = vi.fn();
  confirmOrder = vi.fn();
  updateItemInOrder = vi.fn();
  addItemToOrderDb = vi.fn();
  addItemError = null;
  bleepers = {};
  firstAvailableBleeper = 1;
  findNextAvailableBleeper = vi.fn();
  setBleeperAvailability = vi.fn();
  getProductsByCategory = vi.fn().mockReturnValue([]);
  getSubCat = vi.fn();
});

describe("OrderTakingContainer", () => {
  it("maps menuType to categories", () => {
  render(<OrderTakingContainer menuType="nonalcoholic" />);
  const expected: CategoryType[] = [
    "Coffee",
    "Tea",
    "Juices",
    "Smoothies",
    "Soda",
  ];
  expect(getCapturedProps().categories).toEqual(expected);
});

  it("adds products by default", () => {
  getSubCat.mockReturnValue("coffee");
  render(<OrderTakingContainer menuType="nonalcoholic" />);
  act(() => {
    getCapturedProps().onAddProduct("Espresso", 2);
  });
  expect(addItemToOrderDb).toHaveBeenCalledWith("Espresso", 2, "Bar");
});

  it("handles mixed drink modal flow", () => {
  render(<OrderTakingContainer menuType="alcoholic" />);
  act(() => {
    getCapturedProps().onSelectCategory("Mixed Drinks");
  });
  act(() => {
    getCapturedProps().onAddProduct("Rum", 5);
  });
  expect(mixerModalProps).toBeTruthy();
  act(() => {
    getMixerModalProps().onSelect("Mixer Cola");
  });
  expect(addItemToOrderDb).toHaveBeenCalledWith("Rum + Cola", 5, "Bar");
  // reopen with "nothing" branch
  act(() => {
    getCapturedProps().onAddProduct("Rum", 5);
  });
  act(() => {
    getMixerModalProps().onSelect("nothing");
  });
  expect(addItemToOrderDb).toHaveBeenCalledWith("Rum", 5, "Bar");
  // reopen and cancel
  act(() => {
    getCapturedProps().onAddProduct("Rum", 5);
  });
  act(() => {
    getMixerModalProps().onCancel();
  });
  expect(addItemToOrderDb).toHaveBeenCalledTimes(2);
});

  it("confirms payment and resets bleep", async () => {
    findNextAvailableBleeper.mockReturnValue(2);
  render(<OrderTakingContainer menuType="nonalcoholic" />);
  await act(async () => {
    await getCapturedProps().onConfirmPayment("cash", "go");
  });
  expect(confirmOrder).toHaveBeenCalledWith(
    "2",
    "tester",
    expect.any(String),
    "cash"
  );
  expect(setBleeperAvailability).toHaveBeenCalledWith(2, false);

  // invalid typed bleep falls back to next available
  act(() => {
    getCapturedProps().onBleepNumberChange("foo");
  });
  findNextAvailableBleeper.mockReturnValue(3);
  await act(async () => {
    await getCapturedProps().onConfirmPayment("card", "bleep");
  });
    expect(confirmOrder).toHaveBeenLastCalledWith(
      "3",
      "tester",
      expect.any(String),
      "card"
    );
  });

  it("handles iced coffee modal callbacks", () => {
  render(<OrderTakingContainer menuType="nonalcoholic" />);
  act(() => {
    getCapturedProps().onAddProduct("Iced Latte", 4);
  });
  act(() => {
    getIcedModalProps().onSelectSweetness("Iced Latte sweet", 5);
  });
  expect(addItemToOrderDb).toHaveBeenCalledWith("Iced Latte sweet", 5, "Bar");
  addItemToOrderDb.mockClear();
  act(() => {
    getCapturedProps().onAddProduct("Iced Latte", 4);
  });
  act(() => {
    getIcedModalProps().onCancel();
  });
  expect(addItemToOrderDb).not.toHaveBeenCalled();
});

  it("handles Americano quick path", () => {
  render(<OrderTakingContainer menuType="nonalcoholic" />);
  act(() => {
    getCapturedProps().onAddProduct("Americano", 3);
  });
  expect(milkModalProps).toBeTruthy();
  act(() => {
    getMilkModalProps().onSelectMilkOption("Americano + Whole", 4);
  });
  expect(addItemToOrderDb).toHaveBeenCalledWith("Americano + Whole", 4, "Bar");
});

  it("attaches milk using last caffeinated click", () => {
  getSubCat.mockImplementation((n: string) =>
    n === "Oat Milk" ? "milkAddOn" : "coffee"
  );
  render(<OrderTakingContainer menuType="nonalcoholic" />);
  act(() => {
    getCapturedProps().onAddProduct("Latte", 4);
  });
  addItemToOrderDb.mockClear();
  act(() => {
    getCapturedProps().onAddProduct("Oat Milk", 1);
  });
  expect(updateItemInOrder).toHaveBeenCalledWith(
    "Latte",
    "Latte + Oat Milk",
    5
  );
});

  it("attaches milk to existing single caffeinated item", () => {
  getSubCat.mockImplementation((n: string) =>
    n === "Oat Milk" ? "milkAddOn" : "coffee"
  );
  mockOrder.items.push({ product: "Mocha", price: 3 });
  render(<OrderTakingContainer menuType="nonalcoholic" />);
  act(() => {
    getCapturedProps().onAddProduct("Oat Milk", 1);
  });
  expect(updateItemInOrder).toHaveBeenCalledWith(
    "Mocha",
    "Mocha + Oat Milk",
    4
  );
});

  it("prompts to select base when multiple caffeinated items", () => {
  getSubCat.mockImplementation((n: string) =>
    n === "Oat Milk" ? "milkAddOn" : "coffee"
  );
  mockOrder.items.push({ product: "Espresso", price: 2 }, { product: "Tea", price: 2 });
  render(<OrderTakingContainer menuType="nonalcoholic" />);
  act(() => {
    getCapturedProps().onAddProduct("Oat Milk", 1);
  });
  expect(selectBaseProps).toBeTruthy();
  act(() => {
    getSelectBaseProps().onSelectOrder("Espresso");
  });
  expect(updateItemInOrder).toHaveBeenCalledWith(
    "Espresso",
    "Espresso + Oat Milk",
    3
  );
});

  it("alerts when no caffeinated item available", () => {
  getSubCat.mockReturnValue("milkAddOn");
  const alertSpy = vi.fn();
  const originalAlert = window.alert;
  window.alert = alertSpy as unknown as typeof window.alert;
  render(<OrderTakingContainer menuType="nonalcoholic" />);
  act(() => {
    getCapturedProps().onAddProduct("Oat Milk", 1);
  });
  expect(alertSpy).toHaveBeenCalledWith(
    "There are no caffeinated items to attach this milk to."
  );
    window.alert = originalAlert;
  });

  it("renders error banner when add item fails", () => {
  addItemError = new Error("boom");
  render(<OrderTakingContainer menuType="nonalcoholic" />);
  expect(
    screen.getByText(/Error adding item to order: Error: boom/)
  ).toBeInTheDocument();
});
});

