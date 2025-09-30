import { fireEvent, render, screen } from "@testing-library/react";
import AnnouncementBarEditor from "../AnnouncementBarEditor";

// Mock LocalizedTextInput to avoid async effects and provide a simple text input
jest.mock("../../LocalizedTextInput", () => ({
  __esModule: true,
  default: ({ value, onChange }: { value?: string; onChange: (v: string) => void }) => (
    <input placeholder="text" value={value ?? ""} onChange={(e) => onChange((e.target as HTMLInputElement).value)} />
  ),
}));

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
