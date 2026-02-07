import { fireEvent, render, screen } from "@testing-library/react";

import { useImageOrientationValidation } from "../../../hooks/useImageOrientationValidation";
import ImageUploaderWithOrientationCheck from "../ImageUploaderWithOrientationCheck";

jest.mock("../../../hooks/useImageOrientationValidation");

describe("ImageUploaderWithOrientationCheck", () => {
  const mockUseImageOrientationValidation = useImageOrientationValidation as unknown as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls onChange with the selected file and shows no feedback when orientation is unknown", () => {
    mockUseImageOrientationValidation
      .mockReturnValueOnce({ actual: null, isValid: null })
      .mockReturnValueOnce({ actual: null, isValid: null });

    const handleChange = jest.fn();
    const file = new File(["hello"], "test.png", { type: "image/png" });

    const { container, rerender } = render(
      <ImageUploaderWithOrientationCheck
        file={null}
        onChange={handleChange}
        requiredOrientation="portrait"
      />
    );

    const input = container.querySelector("input[type='file']") as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });
    expect(handleChange).toHaveBeenCalledWith(file);

    rerender(
      <ImageUploaderWithOrientationCheck
        file={file}
        onChange={handleChange}
        requiredOrientation="portrait"
      />
    );

    const feedback = screen.queryByText(/Image orientation|Selected image/);
    expect(feedback).not.toBeInTheDocument();
  });

  it("shows success message when orientation matches", () => {
    mockUseImageOrientationValidation.mockReturnValue({
      actual: "portrait",
      isValid: true,
    });

    const file = new File(["hello"], "good.png", { type: "image/png" });

    render(
      <ImageUploaderWithOrientationCheck
        file={file}
        onChange={jest.fn()}
        requiredOrientation="portrait"
      />
    );

    const feedback = screen.getByText(
      "Image orientation is portrait; requirement satisfied."
    );
    expect(feedback).toBeInTheDocument();
    expect(feedback).toHaveClass("text-sm text-success");
  });

  it("clears the file and removes feedback", () => {
    mockUseImageOrientationValidation
      .mockReturnValueOnce({ actual: "portrait", isValid: true })
      .mockReturnValueOnce({ actual: null, isValid: null });

    const handleChange = jest.fn();
    const file = new File(["hello"], "good.png", { type: "image/png" });

    const { container, rerender } = render(
      <ImageUploaderWithOrientationCheck
        file={file}
        onChange={handleChange}
        requiredOrientation="portrait"
      />
    );

    expect(
      screen.getByText(
        "Image orientation is portrait; requirement satisfied."
      )
    ).toBeInTheDocument();

    const input = container.querySelector("input[type='file']") as HTMLInputElement;
    fireEvent.change(input, { target: { files: [] } });
    expect(handleChange).toHaveBeenCalledWith(null);

    rerender(
      <ImageUploaderWithOrientationCheck
        file={null}
        onChange={handleChange}
        requiredOrientation="portrait"
      />
    );

    const feedback = screen.queryByText(/Image orientation|Selected image/);
    expect(feedback).not.toBeInTheDocument();
  });

  it("re-renders only when props change", () => {
    mockUseImageOrientationValidation.mockReturnValue({
      actual: null,
      isValid: null,
    });

    const handleChange = jest.fn();
    const { rerender } = render(
      <ImageUploaderWithOrientationCheck
        file={null}
        onChange={handleChange}
        requiredOrientation="portrait"
      />
    );
    expect(mockUseImageOrientationValidation).toHaveBeenCalledTimes(1);

    rerender(
      <ImageUploaderWithOrientationCheck
        file={null}
        onChange={handleChange}
        requiredOrientation="portrait"
      />
    );
    expect(mockUseImageOrientationValidation).toHaveBeenCalledTimes(1);

    const nextFile = new File(["next"], "next.png", { type: "image/png" });
    rerender(
      <ImageUploaderWithOrientationCheck
        file={nextFile}
        onChange={handleChange}
        requiredOrientation="portrait"
      />
    );
    expect(mockUseImageOrientationValidation).toHaveBeenCalledTimes(2);
  });
});
