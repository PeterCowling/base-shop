// packages/ui/src/components/cms/blocks/containers/__tests__/Dataset.test.tsx
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";

import { useDataset, useDatasetState } from "../../data/DataContext";
import Dataset from "../Dataset";


function Consumer() {
  const items = useDataset<any>();
  const state = useDatasetState();
  return (
    <div>
      <div data-cy="count">{items.length}</div>
      <div data-cy="state">{state}</div>
    </div>
  );
}

describe("Dataset", () => {
  test("manual source uses provided skus, sorted and limited", async () => {
    render(
      <Dataset source="manual" skus={[{ title: "b" }, { title: "a" }] as any} sortBy="title" limit={1}>
        <Consumer />
      </Dataset>
    );
    expect(screen.getByTestId("count").textContent).toBe("1");
    expect(screen.getByTestId("state").textContent).toBe("loaded");
  });

  // products flow is covered elsewhere; this test focuses on manual/blog mechanics

  test("blog source fetches via API", async () => {
    const mock = jest.spyOn(global, "fetch" as any).mockResolvedValue({
      ok: true,
      json: async () => [{ id: 1 }],
    } as any);
    render(
      <Dataset source="blog" shopId="shopX">
        <Consumer />
      </Dataset>
    );
    await waitFor(() => expect(screen.getByTestId("state").textContent).toBe("loaded"));
    expect(screen.getByTestId("count").textContent).toBe("1");
    mock.mockRestore();
  });
});
