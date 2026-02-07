// packages/ui/src/components/cms/__tests__/SectionBuilder.test.tsx
import React from "react";
import { fireEvent,render, screen } from "@testing-library/react";

import SectionBuilder from "../SectionBuilder";

jest.mock("../page-builder/PageBuilder", () => ({
  __esModule: true,
  default: (props: any) => {
    ;(globalThis as any).__lastPBProps = props;
    return (
      <div>
        <button onClick={() => props.onSave(new FormData())}>save</button>
        <button onClick={() => props.onPublish(new FormData())}>publish</button>
        <div data-cy="mode">{props.mode}</div>
        <div data-cy="page-components">{(props.page?.components || []).length}</div>
      </div>
    );
  },
}));

describe("SectionBuilder", () => {
  const template = {
    id: "t1",
    label: "Hero",
    status: "draft",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "u1",
    template: { type: "Section", id: "s1" },
  } as any;

  test("maps SectionTemplate to single-component Page and passes mode=section", () => {
    const onSave = jest.fn();
    const onPublish = jest.fn();
    render(
      <SectionBuilder template={template} onSave={onSave} onPublish={onPublish} />
    );
    expect(screen.getByTestId("mode").textContent).toBe("section");
    expect(screen.getByTestId("page-components").textContent).toBe("1");
  });

  test("wraps onSave/onPublish and forwards template in FormData when components provided", async () => {
    const onSave = jest.fn();
    const onPublish = jest.fn();
    const { getByText } = render(
      <SectionBuilder template={template} onSave={onSave} onPublish={onPublish} />
    );

    // Call wrapped onSave with a FormData that includes components
    const fd = new FormData();
    fd.set("components", JSON.stringify([{ type: "Section", id: "abc" }]));
    const last = (globalThis as any).__lastPBProps;
    await last.onSave(fd);
    // Expect our outer onSave to have been called with a FormData that contains template
    const calledFd: FormData = onSave.mock.calls[0][0];
    expect(calledFd.get("id")).toBe(template.id);
    expect(calledFd.get("label")).toBe(template.label);
    expect(calledFd.get("status")).toBe(template.status);
    expect(calledFd.get("template")).toBe(JSON.stringify({ type: "Section", id: "abc" }));
  });
});
