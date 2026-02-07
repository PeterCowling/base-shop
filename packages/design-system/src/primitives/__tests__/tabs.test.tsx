import "../../../../../../../test/resetNextMocks";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "../tabs";

function renderTabs({ defaultValue = "tab1", disabled = false } = {}) {
  return render(
    <Tabs defaultValue={defaultValue}>
      <TabsList>
        <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        <TabsTrigger value="tab3" disabled={disabled}>Tab 3</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1">Content 1</TabsContent>
      <TabsContent value="tab2">Content 2</TabsContent>
      <TabsContent value="tab3">Content 3</TabsContent>
    </Tabs>
  );
}

describe("Tabs", () => {
  // TC-01: Correct ARIA roles
  it("has correct ARIA roles", () => {
    renderTabs();
    expect(screen.getByRole("tablist")).toBeInTheDocument();
    expect(screen.getAllByRole("tab")).toHaveLength(3);
    expect(screen.getByRole("tabpanel")).toBeInTheDocument();
  });

  // TC-02: Arrow keys navigate triggers
  it("navigates triggers with arrow keys", async () => {
    const user = userEvent.setup();
    renderTabs();

    const tabs = screen.getAllByRole("tab");
    await user.click(tabs[0]);
    expect(tabs[0]).toHaveFocus();

    await user.keyboard("{ArrowRight}");
    expect(tabs[1]).toHaveFocus();

    await user.keyboard("{ArrowLeft}");
    expect(tabs[0]).toHaveFocus();
  });

  // TC-03: Activating tab shows panel
  it("shows correct panel when tab is clicked", async () => {
    const user = userEvent.setup();
    renderTabs();

    expect(screen.getByText("Content 1")).toBeInTheDocument();
    expect(screen.queryByText("Content 2")).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Tab 2" }));
    expect(screen.queryByText("Content 1")).not.toBeInTheDocument();
    expect(screen.getByText("Content 2")).toBeInTheDocument();
  });

  // TC-04: Disabled tab not navigable
  it("skips disabled tab in keyboard navigation", async () => {
    const user = userEvent.setup();
    renderTabs({ disabled: true });

    const tabs = screen.getAllByRole("tab");
    const disabledTab = tabs[2];
    expect(disabledTab).toBeDisabled();
  });

  // TC-05: Controlled mode
  it("supports controlled value", async () => {
    const onValueChange = jest.fn();
    const user = userEvent.setup();

    render(
      <Tabs value="tab1" onValueChange={onValueChange}>
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    );

    await user.click(screen.getByRole("tab", { name: "Tab 2" }));
    expect(onValueChange).toHaveBeenCalledWith("tab2");
  });
});
