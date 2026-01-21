import { fireEvent,render } from "@testing-library/react";

import DatasetStep from "../src/app/cms/blog/sanity/connect/DatasetStep";

jest.mock(
  "@/components/atoms/shadcn",
  () => {
    const React = require("react");
    return {
      __esModule: true,
      Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    };
  },
  { virtual: true },
);

describe("DatasetStep", () => {
  const baseProps = {
    projectId: "p",
    token: "t",
    dataset: "blog",
    setDataset: () => {},
    datasets: ["blog"],
    isAddingDataset: false,
    setIsAddingDataset: () => {},
    aclMode: "public" as const,
    setAclMode: () => {},
    verifyStatus: "idle" as const,
    verifyError: "",
    formAction: () => {},
  };

  it("calls handleSubmit on submit", () => {
    const handleSubmit = jest.fn();
    const { container } = render(
      <DatasetStep {...baseProps} handleSubmit={handleSubmit} />
    );
    const form = container.querySelector("form")!;
    fireEvent.submit(form);
    expect(handleSubmit).toHaveBeenCalled();
  });

  it("adds hidden input when creating dataset", () => {
    const { container } = render(
      <DatasetStep
        {...baseProps}
        dataset="new"
        isAddingDataset={true}
        handleSubmit={() => {}}
      />
    );
    const hidden = container.querySelector('input[name="createDataset"]');
    expect(hidden).not.toBeNull();
  });
});
