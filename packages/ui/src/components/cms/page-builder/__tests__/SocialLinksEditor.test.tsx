import { fireEvent, render, screen } from "@testing-library/react";

import SocialLinksEditor from "../SocialLinksEditor";

describe("SocialLinksEditor", () => {
  const baseComponent = {
    id: "social-1",
    type: "SocialLinks",
    facebook: "",
    instagram: "",
    x: "",
    youtube: "",
    linkedin: "",
  };

  it.each([
    { label: "Facebook URL", field: "facebook" },
    { label: "Instagram URL", field: "instagram" },
    { label: "X URL", field: "x" },
    { label: "YouTube URL", field: "youtube" },
    { label: "LinkedIn URL", field: "linkedin" },
  ])("propagates %s changes", ({ label, field }) => {
    const onChange = jest.fn();
    render(<SocialLinksEditor component={{ ...baseComponent } as any} onChange={onChange} />);

    const input = screen.getByLabelText(label);
    fireEvent.change(input, { target: { value: "https://example.com" } });

    expect(onChange).toHaveBeenCalledWith({ [field]: "https://example.com" });
  });
});
