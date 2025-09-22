import { render, screen } from "@testing-library/react";
import CommentsDrawer from "../CommentsDrawer";

let lastPeople: string[] = [];
let lastThreadId: string | null = null;

jest.mock("../CommentsThreadDetails", () => ({
  __esModule: true,
  default: (props: any) => {
    lastPeople = props.people;
    lastThreadId = props.thread?.id ?? null;
    return <div data-cy="details" />;
  },
}));

// Keep the list minimal to avoid heavy interactions; just render container
jest.mock("../CommentsThreadList", () => ({
  __esModule: true,
  default: (props: any) => <div data-cy="list" data-count={props.filtered.length} />,
}));

describe("CommentsDrawer", () => {
  it("derives people from threads (mentions, assigned, me) and passes selected thread", () => {
    const threads = [
      {
        id: "t1",
        componentId: "c1",
        resolved: false,
        assignedTo: "alice",
        messages: [
          { id: "m1", text: "hi @bob", ts: new Date().toISOString() },
          { id: "m2", text: "see https://example.com and @carol", ts: new Date().toISOString() },
        ],
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-02T00:00:00.000Z",
      },
      {
        id: "t2",
        componentId: "c2",
        resolved: true,
        messages: [{ id: "m3", text: "done", ts: new Date().toISOString() }],
        createdAt: "2024-01-03T00:00:00.000Z",
        updatedAt: "2024-01-04T00:00:00.000Z",
      },
    ] as any;

    render(
      <CommentsDrawer
        open={true}
        onOpenChange={() => {}}
        threads={threads}
        selectedId={"t1"}
        onSelect={() => {}}
        onAddMessage={async () => {}}
        onToggleResolved={async () => {}}
        onAssign={async () => {}}
        shop="shop-1"
        me="me@example.com"
      />
    );

    expect(screen.getByTestId("details")).toBeInTheDocument();
    // Selected thread id is passed through
    expect(lastThreadId).toBe("t1");
    // People include me, assigned, and @-mentions (deduped, order not guaranteed)
    expect(new Set(lastPeople)).toEqual(new Set(["me@example.com", "alice", "bob", "carol"]));
  });
});

