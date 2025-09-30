import { fireEvent, render, screen } from "@testing-library/react";
import MapBlockEditor from "../MapBlockEditor";

jest.mock("../../../atoms/shadcn", () => ({
  __esModule: true,
  // Omit non-DOM props like labelSuffix to avoid warnings
  Input: ({ label, labelSuffix: _labelSuffix, ...props }: any) => {
    const id = label ? label.replace(/\s+/g, "-") : undefined;
    return (
      <div>
        {label && <label htmlFor={id}>{label}</label>}
        <input id={id} {...props} />
      </div>
    );
  },
}));

describe("MapBlockEditor", () => {
  it("calls onChange with number", () => {
    const onChange = jest.fn();
    render(<MapBlockEditor component={{} as any} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Latitude"), {
      target: { value: "12" },
    });
    expect(onChange).toHaveBeenCalledWith({ lat: 12 });
  });

  it("handles empty string as undefined", () => {
    const onChange = jest.fn();
    render(<MapBlockEditor component={{ lat: 5 } as any} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Latitude"), {
      target: { value: "" },
    });
    expect(onChange).toHaveBeenCalledWith({ lat: undefined });
  });
});
