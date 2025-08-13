// apps/shop-abc/__tests__/permissionScenarios.test.tsx
import { hasPermission } from "../../../packages/auth/src/permissions";
import React from "react";
import { render, screen } from "@testing-library/react";

type Role = "viewer" | "customer" | "admin";

function AddButton({ role }: { role: Role }) {
  return hasPermission(role, "add_to_cart") ? (
    <button>Add to cart</button>
  ) : (
    <p>No access</p>
  );
}

describe("storefront permission scenarios", () => {
  it("viewer cannot add to cart", () => {
    render(<AddButton role="viewer" />);
    expect(screen.getByText("No access")).toBeInTheDocument();
  });

  it("customer can add to cart", () => {
    render(<AddButton role="customer" />);
    expect(screen.getByText("Add to cart")).toBeInTheDocument();
  });

  it("admin can add to cart", () => {
    render(<AddButton role="admin" />);
    expect(screen.getByText("Add to cart")).toBeInTheDocument();
  });
});
