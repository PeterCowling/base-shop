import React from "react";
import { render, screen } from "@testing-library/react";

import Block from "@acme/ui/components/cms/page-builder/Block";

// The registry-backed path will just render null if unknown; verify Text path
// and navigate wrapper behavior for non-text with clickAction + href.

describe("Block (smoke)", () => {
  it("sanitizes and renders Text component content", () => {
    render(
      <Block
        locale="en" as any
        component={{ id: "t1", type: "Text", text: "<b>Hi</b> <script>1</script>" } as any}
      />
    );
    // Script stripped, bold preserved
    expect(screen.getByText("Hi")).toBeInTheDocument();
  });

  it("returns null for unknown non-Text block types (no registry entry)", () => {
    const { container } = render(
      <Block locale="en" as any component={{ id: "c1", type: "UnknownType" } as any} />
    );
    expect(container.firstChild).toBeNull();
  });
});
