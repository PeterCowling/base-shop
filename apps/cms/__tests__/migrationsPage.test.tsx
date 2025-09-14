import { render, screen } from "@testing-library/react";
import MigrationsPage from "../src/app/cms/migrations/page";

describe("MigrationsPage", () => {
  it("renders heading", () => {
    render(<MigrationsPage />);
    expect(
      screen.getByRole("heading", { name: /shop migration/i })
    ).toBeInTheDocument();
  });
});
