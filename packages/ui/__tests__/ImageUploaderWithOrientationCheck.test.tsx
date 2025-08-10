import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import ImageUploaderWithOrientationCheck from "../components/cms/ImageUploaderWithOrientationCheck";
import { useImageOrientationValidation } from "@ui";

jest.mock("@ui", () => ({
  ...(jest.requireActual("@ui") as any),
  useImageOrientationValidation: jest.fn(),
}));

const mockHook = useImageOrientationValidation as jest.MockedFunction<
  typeof useImageOrientationValidation
>;

function Wrapper() {
  const [file, setFile] = useState<File | null>(null);
  return (
    <ImageUploaderWithOrientationCheck
      file={file}
      onChange={setFile}
      requiredOrientation="landscape"
    />
  );
}

describe("ImageUploaderWithOrientationCheck", () => {
  it("renders orientation warnings based on hook result", () => {
    const firstFile = new File(["a"], "a.png", { type: "image/png" });
    const secondFile = new File(["b"], "b.png", { type: "image/png" });

    mockHook.mockImplementation((file) => {
      if (file === firstFile) {
        return { actual: "landscape", isValid: true };
      }
      if (file === secondFile) {
        return { actual: "portrait", isValid: false };
      }
      return { actual: null, isValid: null };
    });

    const { container } = render(<Wrapper />);
    const input = container.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    fireEvent.change(input, { target: { files: [firstFile] } });
    expect(
      screen.getByText("Image orientation is landscape; requirement satisfied.")
    ).toBeInTheDocument();
    expect(container.querySelector("p")?.className).toContain("text-green-600");

    fireEvent.change(input, { target: { files: [secondFile] } });
    expect(
      screen.getByText(
        "Selected image is portrait; please upload a landscape image."
      )
    ).toBeInTheDocument();
    expect(container.querySelector("p")?.className).toContain("text-red-600");
  });
});
