// packages/ui/src/components/ab/__tests__/ExperimentGate.test.tsx
import { render, screen, waitFor } from "@testing-library/react";

import ExperimentGate from "../ExperimentGate";

describe("ExperimentGate", () => { // i18n-exempt: test titles
  const baseUrl = window.location.origin;

  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState({}, "", `${baseUrl}/`);
  });

  test("prefers explicit enabled prop when provided", async () => { // i18n-exempt: test title
    const { rerender } = render(
      <ExperimentGate enabled fallback={<span>off</span>}>
        <span>on</span>
      </ExperimentGate>
    );

    expect(screen.getByText("on")).toBeInTheDocument();

    rerender(
      <ExperimentGate enabled={false} fallback={<span>off</span>}>
        <span>on</span>
      </ExperimentGate>
    );

    await waitFor(() => expect(screen.getByText("off")).toBeInTheDocument());
    expect(screen.queryByText("on")).not.toBeInTheDocument();
  });

  test("reads query parameter overrides and persists to localStorage", async () => { // i18n-exempt: test title
    window.history.replaceState({}, "", `${baseUrl}/product?exp-demo=off`);

    render(
      <ExperimentGate flag="demo" fallback={<span>off</span>}>
        <span>on</span>
      </ExperimentGate>
    );

    await waitFor(() => expect(screen.getByText("off")).toBeInTheDocument());
    expect(localStorage.getItem("exp:demo")).toBe("off");
  });

  test("falls back to stored preference when query parameter is absent", async () => { // i18n-exempt: test title
    localStorage.setItem("exp:demo", "on");

    render(
      <ExperimentGate flag="demo" fallback={<span>off</span>}>
        <span>on</span>
      </ExperimentGate>
    );

    await waitFor(() => expect(screen.getByText("on")).toBeInTheDocument());
  });

  test("ignores errors when resolving overrides", async () => { // i18n-exempt: test title
    const originalURL = window.URL;
    window.URL = jest.fn(() => {
      throw new Error("bad url");
    }) as unknown as typeof URL;

    render(
      <ExperimentGate flag="demo" fallback={<span>off</span>}>
        <span>on</span>
      </ExperimentGate>
    );

    await waitFor(() => expect(screen.getByText("on")).toBeInTheDocument());

    window.URL = originalURL;
  });
});
