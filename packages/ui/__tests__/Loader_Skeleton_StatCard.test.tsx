import React from "react";
import { render, screen } from "@testing-library/react";

import { Loader } from "../src/components/atoms/Loader";
import { Skeleton } from "../src/components/atoms/Skeleton";
import { StatCard } from "../src/components/atoms/StatCard";

describe("Loader, Skeleton, StatCard", () => {
  it("Loader applies size as inline style", () => {
    const { container } = render(<Loader size={24} />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.width).toBe("24px");
    expect(el.style.height).toBe("24px");
  });

  it("Loader defaults to 20px when size omitted", () => {
    const { container } = render(<Loader />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.width).toBe("20px");
    expect(el.style.height).toBe("20px");
  });

  it("Skeleton renders with base classes and custom class", () => {
    const { container } = render(<Skeleton className="h-4 w-8" />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toMatch(/animate-pulse/);
    expect(el.className).toMatch(/h-4/);
  });

  it("StatCard renders label and value", () => {
    render(<StatCard label="Sales" value={123} />);
    expect(screen.getByText("Sales")).toBeInTheDocument();
    expect(screen.getByText("123")).toBeInTheDocument();
  });

  it("StatCard merges custom className", () => {
    // Use a non-focus class to avoid focus ring lint warning
    const { container } = render(<StatCard label="L" value={1} className="p-1" />);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toMatch(/p-1/);
  });
});
