import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import StepImportData from "../StepImportData";

const markComplete = jest.fn();
const push = jest.fn();

jest.mock("../../hooks/useStepCompletion", () => ({
  __esModule: true,
  default: () => [false, markComplete],
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

describe("StepImportData", () => {
  it("handles file upload, text input, and save", async () => {
    const setCsvFile = jest.fn();
    const setCategoriesText = jest.fn();
    const saveData = jest.fn().mockResolvedValue(undefined);

    render(
      <StepImportData
        setCsvFile={setCsvFile}
        categoriesText=""
        setCategoriesText={setCategoriesText}
        importResult={null}
        importing={false}
        saveData={saveData}
      />
    );

    const file = new File(["name"], "products.csv", { type: "text/csv" });
    const fileInput = screen.getByLabelText("Products CSV");
    fireEvent.change(fileInput, { target: { files: [file] } });
    expect(setCsvFile).toHaveBeenCalledWith(file);

    const textarea = screen.getByPlaceholderText('["Shoes","Accessories"]');
    fireEvent.change(textarea, { target: { value: "{\"a\":1}" } });
    expect(setCategoriesText).toHaveBeenCalledWith("{\"a\":1}");

    await userEvent.click(
      screen.getByRole("button", { name: /save & return/i })
    );

    expect(saveData).toHaveBeenCalled();
    await waitFor(() => expect(markComplete).toHaveBeenCalledWith(true));
    expect(push).toHaveBeenCalledWith("/cms/configurator");
  });
});

