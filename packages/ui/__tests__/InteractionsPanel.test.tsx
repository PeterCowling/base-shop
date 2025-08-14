import { render, screen } from "@testing-library/react";
import InteractionsPanel from "../src/components/cms/page-builder/panels/InteractionsPanel";
import type { PageComponent } from "@acme/types";

test("renders interactions placeholder", () => {
  const component: PageComponent = { id: "1", type: "Image" } as any;
  render(<InteractionsPanel component={component} />);
  expect(screen.getByText(/No interactions available/)).toBeInTheDocument();
});
