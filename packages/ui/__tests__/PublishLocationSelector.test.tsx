import { fireEvent, render, screen } from "@testing-library/react";

import PublishLocationSelector from "../src/components/cms/PublishLocationSelector";

const locations = [
  { id: "a", name: "A", description: "Alpha", requiredOrientation: "landscape" },
  { id: "b", name: "B", description: "Beta", requiredOrientation: "portrait" },
];

const reload = jest.fn();

jest.mock("@acme/platform-core/hooks/usePublishLocations", () => ({
  usePublishLocations: () => ({ locations, reload }),
}));

describe("PublishLocationSelector", () => {
  beforeEach(() => {
    reload.mockClear();
  });

  it("calls onChange with updated ids when toggling", () => {
    const onChange = jest.fn();
    const { rerender } = render(
      <PublishLocationSelector selectedIds={["a"]} onChange={onChange} />
    );

    fireEvent.click(screen.getAllByRole("checkbox")[1]);
    expect(onChange).toHaveBeenCalledWith(["a", "b"]);

    rerender(
      <PublishLocationSelector selectedIds={["a", "b"]} onChange={onChange} />
    );

    fireEvent.click(screen.getAllByRole("checkbox")[0]);
    expect(onChange).toHaveBeenLastCalledWith(["b"]);
  });

  it("invokes reload when refresh clicked", () => {
    const onChange = jest.fn();
    render(
      <PublishLocationSelector
        selectedIds={[]}
        onChange={onChange}
        showReload
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /refresh list/i }));
    expect(reload).toHaveBeenCalled();
  });
});

