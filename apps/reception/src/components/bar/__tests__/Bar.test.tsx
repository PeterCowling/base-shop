import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";

// Mock useAuth to provide a user so HeaderControls renders
vi.mock("../../../context/AuthContext", () => ({
  useAuth: () => ({ user: { user_name: "Tester" } }),
}));

// Mock child screens to simple placeholders capturing props
const orderTakingSpy = vi.hoisted(() => vi.fn());
vi.mock("../orderTaking/OrderTakingContainer", () => ({
  __esModule: true,
  default: ({ menuType }: { menuType: string }) => {
    orderTakingSpy(menuType);
    return <div>OrderTaking {menuType}</div>;
  },
}));

vi.mock("../sales/SalesScreen", () => ({
  __esModule: true,
  default: () => <div>Sales Screen</div>,
}));

vi.mock("../CompScreen", () => ({
  __esModule: true,
  default: () => <div>Comp Screen</div>,
}));

import Bar from "../Bar";

describe("Bar", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("switches between screens", () => {
    render(<Bar />);

    // starts on order taking
    expect(screen.getByText("OrderTaking food")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /sales/i }));
    expect(screen.getByText("Sales Screen")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /comp/i }));
    expect(screen.getByText("Comp Screen")).toBeInTheDocument();
  });

  it("changes menu type when tabs are clicked", () => {
    render(<Bar />);

    // default menuType is food
    expect(orderTakingSpy).toHaveBeenLastCalledWith("food");

    fireEvent.click(
      screen.getByRole("button", { name: /^Alcoholic$/i })
    );
    expect(orderTakingSpy).toHaveBeenLastCalledWith("alcoholic");
    expect(screen.getByText("OrderTaking alcoholic")).toBeInTheDocument();
  });
});

