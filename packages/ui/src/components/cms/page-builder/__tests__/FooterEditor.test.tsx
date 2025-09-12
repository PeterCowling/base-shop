import { render, screen, fireEvent } from "@testing-library/react";
import FooterEditor from "../FooterEditor";

const arrayEditorMock = jest.fn(() => <div data-cy="links-editor" />);
const useArrayEditorMock = jest.fn(() => arrayEditorMock);

jest.mock("../useArrayEditor", () => ({
  __esModule: true,
  useArrayEditor: (onChange: any) => useArrayEditorMock(onChange),
}));

describe("FooterEditor", () => {
  it("updates fields and invokes links editor", () => {
    const component = {
      type: "Footer" as const,
      shopName: "",
      logoVariants: {
        desktop: { src: "desk.png" },
        tablet: { src: "tab.png" },
        mobile: { src: "mob.png" },
      },
      links: [],
    };
    const onChange = jest.fn();

    render(<FooterEditor component={component} onChange={onChange} />);

    expect(useArrayEditorMock).toHaveBeenCalledWith(onChange);
    expect(arrayEditorMock).toHaveBeenCalledWith(
      "links",
      component.links,
      ["label", "url"]
    );
    expect(screen.getByTestId("links-editor")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("shop name"), {
      target: { value: "Shop" },
    });
    expect(onChange).toHaveBeenNthCalledWith(1, { shopName: "Shop" });

    fireEvent.change(screen.getByPlaceholderText("desktop logo"), {
      target: { value: "desk2.png" },
    });
    expect(onChange).toHaveBeenNthCalledWith(2, {
      logoVariants: {
        desktop: { src: "desk2.png" },
        tablet: { src: "tab.png" },
        mobile: { src: "mob.png" },
      },
    });

    fireEvent.change(screen.getByPlaceholderText("tablet logo"), {
      target: { value: "tab2.png" },
    });
    expect(onChange).toHaveBeenNthCalledWith(3, {
      logoVariants: {
        desktop: { src: "desk.png" },
        tablet: { src: "tab2.png" },
        mobile: { src: "mob.png" },
      },
    });

    fireEvent.change(screen.getByPlaceholderText("mobile logo"), {
      target: { value: "mob2.png" },
    });
    expect(onChange).toHaveBeenNthCalledWith(4, {
      logoVariants: {
        desktop: { src: "desk.png" },
        tablet: { src: "tab.png" },
        mobile: { src: "mob2.png" },
      },
    });
  });
});
