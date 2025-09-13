import { fireEvent, render, screen } from "@testing-library/react";
import AnnouncementBarEditor from "../AnnouncementBarEditor";

describe("AnnouncementBarEditor", () => {
  it("propagates text and link changes separately", () => {
    const onChange = jest.fn();
    render(
      <AnnouncementBarEditor
        component={{ type: "AnnouncementBar", text: "", link: "" }}
        onChange={onChange}
      />
    );

    fireEvent.change(screen.getByPlaceholderText("text"), {
      target: { value: "Hello" },
    });
    expect(onChange).toHaveBeenNthCalledWith(1, { text: "Hello" });

    fireEvent.change(screen.getByPlaceholderText("link"), {
      target: { value: "https://example.com" },
    });
    expect(onChange).toHaveBeenNthCalledWith(2, {
      link: "https://example.com",
    });
  });
});

