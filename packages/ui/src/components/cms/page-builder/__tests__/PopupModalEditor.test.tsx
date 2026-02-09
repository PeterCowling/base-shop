import { fireEvent, render, screen } from "@testing-library/react";

import PopupModalEditor from "../PopupModalEditor";

describe("PopupModalEditor", () => {
  it("calls onChange for all fields", async () => {
    const onChange = jest.fn();
    render(
      <PopupModalEditor
        component={{
          id: "popup-1",
          type: "PopupModal",
          width: "",
          height: "",
          trigger: "" as any,
          delay: undefined,
          content: "",
        }}
        onChange={onChange}
      />
    );

    fireEvent.change(screen.getByPlaceholderText("width"), {
      target: { value: "200" },
    });
    expect(onChange).toHaveBeenNthCalledWith(1, { width: "200" });

    fireEvent.change(screen.getByPlaceholderText("height"), {
      target: { value: "300" },
    });
    expect(onChange).toHaveBeenNthCalledWith(2, { height: "300" });

    fireEvent.click(screen.getByRole("combobox"));
    fireEvent.click(await screen.findByRole("option", { name: "delay" }));
    expect(onChange).toHaveBeenNthCalledWith(3, { trigger: "delay" });

    fireEvent.change(screen.getByPlaceholderText("delay (ms)"), {
      target: { value: "1500" },
    });
    expect(onChange).toHaveBeenNthCalledWith(4, { delay: 1500 });

    fireEvent.change(screen.getByPlaceholderText("content"), {
      target: { value: "hello" },
    });
    expect(onChange).toHaveBeenNthCalledWith(5, { content: "hello" });
  });
});
