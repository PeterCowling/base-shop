import React from "react";
import { fireEvent,render, screen } from "@testing-library/react";

import ImageEditor from "../ImageEditor";

// Mock shadcn dialog
jest.mock("@acme/design-system/shadcn", () => ({
  __esModule: true,
  Dialog: ({ children, open, onOpenChange }: any) => (open ? <div>{children}</div> : null),
  DialogContent: ({ children }: any) => <div role="dialog">{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <div>{children}</div>,
  DialogDescription: ({ children }: any) => <div>{children}</div>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
  Button: (p: any) => <button {...p} />,
  Input: (p: any) => <input {...p} />,
}));

describe("ImageEditor", () => {
  it("parses initial filter, sets aspect/focal, composes filter and calls onApply", () => {
    const onClose = jest.fn();
    const onApply = jest.fn();
    const onApplyFilter = jest.fn();
    const { container } = render(
      <ImageEditor
        open
        src="/img.jpg"
        initial={{ cropAspect: "4:3", focalPoint: { x: 0.1, y: 0.2 } }}
        initialFilter="brightness(120%) contrast(80%) saturate(1.2) blur(2px)"
        onClose={onClose}
        onApply={onApply}
        onApplyFilter={onApplyFilter}
      />
    );
    // Aspect preset toggle modifies state
    fireEvent.click(screen.getByRole("button", { name: "1:1" }));
    // Click in the image container to set focal
    const region = container.querySelector("div[role='dialog'] .relative > div") as HTMLElement;
    // Provide a bounding box for click math
    region.getBoundingClientRect = () => ({ left: 0, top: 0, right: 200, bottom: 100, width: 200, height: 100 } as any);
    fireEvent.click(region, { clientX: 50, clientY: 25 }); // sets focal ~0.25,0.25

    // Apply collects aspect & focal and composes filter
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ cropAspect: "1:1", focalPoint: expect.any(Object) }));
    expect(onApplyFilter).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});

