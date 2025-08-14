import { render } from "@testing-library/react";
import { useEffect } from "react";
import useComponentInputs from "../src/components/cms/page-builder/useComponentInputs";
import useComponentResize from "../src/components/cms/page-builder/useComponentResize";

describe("component hooks", () => {
  it("useComponentInputs patches onChange", () => {
    const onChange = jest.fn();
    function Test() {
      const handleInput = useComponentInputs(onChange);
      useEffect(() => {
        handleInput("foo", "bar");
      }, [handleInput]);
      return null;
    }
    render(<Test />);
    expect(onChange).toHaveBeenCalledWith({ foo: "bar" });
  });

  it("useComponentResize patches onResize", () => {
    const onResize = jest.fn();
    function Test() {
      const handleResize = useComponentResize(onResize);
      useEffect(() => {
        handleResize("widthDesktop", "100%");
      }, [handleResize]);
      return null;
    }
    render(<Test />);
    expect(onResize).toHaveBeenCalledWith({ widthDesktop: "100%" });
  });
});
