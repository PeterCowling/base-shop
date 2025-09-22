import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CommentsToolbar from "../comments/CommentsToolbar";

// Mock the atoms/shadcn primitives to simple DOM controls so we can drive menu actions reliably
jest.mock("../../../atoms/shadcn", () => {
  const Btn = (props: any) => <button {...props} />;
  const Wrap = (p: any) => <div {...p} />;
  const Trigger = (p: any) => <div>{p.children}</div>;
  const Content = (p: any) => <div>{p.children}</div>;
  const Label = (p: any) => <div>{p.children}</div>;
  const Sep = () => <hr />;
  const Item = (p: any) => (
    <button onClick={p.onClick}>{p.children}</button>
  );
  const CheckboxItem = (p: any) => (
    <button onClick={() => p.onCheckedChange?.(!p.checked)} aria-pressed={!!p.checked}>
      {p.children}
    </button>
  );
  return {
    __esModule: true,
    Button: Btn,
    DropdownMenu: Wrap,
    DropdownMenuTrigger: Trigger,
    DropdownMenuContent: Content,
    DropdownMenuLabel: Label,
    DropdownMenuSeparator: Sep,
    DropdownMenuItem: Item,
    DropdownMenuCheckboxItem: CheckboxItem,
  };
});

describe("CommentsToolbar dropdown actions", () => {
  it("toggles show resolved, reloads, and adds for selected; shows peers and overflow", async () => {
    const user = userEvent.setup();
    const onShowResolvedChange = jest.fn();
    const onReload = jest.fn();
    const onAddForSelected = jest.fn();
    const onToggleDrawer = jest.fn();
    const peers = Array.from({ length: 8 }, (_, i) => ({ id: `p${i}`, label: `U${i}`, color: "#f00" } as any));

    render(
      <div>
        <div data-pb-portal-root />
        <CommentsToolbar
          peers={peers}
          showResolved={false}
          onShowResolvedChange={onShowResolvedChange}
          onReload={onReload}
          onAddForSelected={onAddForSelected}
          canAddForSelected={true}
          onToggleDrawer={onToggleDrawer}
          unresolvedCount={5}
        />
      </div>
    );

    await user.click(screen.getByRole("button", { name: /Comments \(5\)/ }));
    expect(onToggleDrawer).toHaveBeenCalled();

    // Open the options and click the items (with mock shadcn these are always in DOM)
    await user.click(screen.getByRole("button", { name: "Comments options" }));
    await user.click(screen.getByText("Show resolved pins"));
    expect(onShowResolvedChange).toHaveBeenCalledWith(true);
    await user.click(screen.getByText("Reload"));
    expect(onReload).toHaveBeenCalled();
    await user.click(screen.getByText("Add for selected"));
    expect(onAddForSelected).toHaveBeenCalled();

    // Peers list shows first 6 and an overflow indicator
    for (let i = 0; i < 6; i++) {
      expect(screen.getByText(`U${i}`)).toBeInTheDocument();
    }
    expect(screen.getByText("+2 more")).toBeInTheDocument();
  });
});
