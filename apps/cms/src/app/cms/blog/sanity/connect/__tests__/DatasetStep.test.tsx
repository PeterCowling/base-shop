import { render, screen, fireEvent } from "@testing-library/react";
import DatasetStep from "../DatasetStep";

const baseProps = () => ({
  projectId: "p",
  token: "t",
  dataset: "blog",
  setDataset: jest.fn(),
  datasets: ["blog", "other"],
  isAddingDataset: false,
  setIsAddingDataset: jest.fn(),
  aclMode: "public" as const,
  setAclMode: jest.fn(),
  verifyStatus: "idle" as const,
  verifyError: "",
  formAction: jest.fn(),
  handleSubmit: jest.fn(),
});

describe("DatasetStep", () => {
  it("handles selecting existing dataset and adding a new one", () => {
    const props = baseProps();
    render(<DatasetStep {...props} />);
    fireEvent.change(screen.getByLabelText(/dataset/i), { target: { value: "other" } });
    expect(props.setDataset).toHaveBeenCalledWith("other");
    expect(props.setIsAddingDataset).toHaveBeenCalledWith(false);
    fireEvent.change(screen.getByLabelText(/dataset/i), { target: { value: "__add__" } });
    expect(props.setIsAddingDataset).toHaveBeenCalledWith(true);
  });

  it("toggles ACL mode and calls handleSubmit", () => {
    const props = baseProps();
    render(<DatasetStep {...props} />);
    fireEvent.change(screen.getByLabelText(/access level/i), { target: { value: "private" } });
    expect(props.setAclMode).toHaveBeenCalledWith("private");
    const form = screen.getByRole("button", { name: /save/i }).closest("form")!;
    fireEvent.submit(form);
    expect(props.handleSubmit).toHaveBeenCalled();
  });
});
