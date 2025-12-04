import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { act } from "react";
import PageBuilder from "../src/components/cms/PageBuilder";

let dndHandlers: any = {};

jest.mock("@dnd-kit/core", () => {
  const React = require("react");
  const actual = jest.requireActual("@dnd-kit/core");
  return {
    // Preserve all actual exports (including drop animation helpers)
    ...actual,
    DndContext: (props: any) => {
      dndHandlers = {
        ...props,
        onDragStart: typeof props.onDragStart === "function" ? props.onDragStart : () => {},
        onDragMove: typeof props.onDragMove === "function" ? props.onDragMove : () => {},
        onDragEnd: typeof props.onDragEnd === "function" ? props.onDragEnd : () => {},
      };
      return <div>{props.children}</div>;
    },
    DragOverlay: ({ children }: any) => <div>{children}</div>,
    useSensor: () => ({}),
    useSensors: (...s: any[]) => s,
    PointerSensor: function PointerSensor() {},
    KeyboardSensor: function KeyboardSensor() {},
    useDroppable: () => ({ setNodeRef: jest.fn(), isOver: false }),
  };
});

jest.mock("@dnd-kit/sortable", () => ({
  SortableContext: ({ children }: any) => <div>{children}</div>,
  rectSortingStrategy: jest.fn(),
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    isDragging: false,
  }),
  arrayMove: (arr: any[], from: number, to: number) => {
    const copy = arr.slice();
    const [item] = copy.splice(from, 1);
    copy.splice(to, 0, item);
    return copy;
  },
  sortableKeyboardCoordinates: jest.fn(),
}));

jest.mock("@ui/components/cms/page-builder/Palette", () => ({
  __esModule: true,
  default: ({ onAdd }: any) => (
    <button onClick={() => onAdd("Text")}>Add Block</button>
  ),
}));

jest.mock("@ui/hooks/useFileUpload", () => ({
  __esModule: true,
  default: () => ({ onDrop: jest.fn(), progress: 0, isValid: true }),
}));

jest.mock("@acme/i18n", () => ({
  __esModule: true,
  useTranslations: () => (key: string) => key,
}));

jest.mock("@acme/i18n/locales", () => ({ locales: ["en"] }));

jest.mock("next/navigation", () => ({ usePathname: () => "/shop" }));

jest.mock("@ui/components/cms/page-builder/CanvasItem", () => ({
  __esModule: true,
  default: ({ component, onRemove }: any) => {
    const overrides = component.styles ? JSON.parse(component.styles) : {};
    const color = overrides.color?.fg;
    return (
      <div role="listitem">
        <div data-cy={`block-${component.id}`} style={{ color }}>
          {component.type}
        </div>
        <button onClick={onRemove}>×</button>
      </div>
    );
  },
}));

jest.mock("@ui/components/cms/page-builder/Block", () => ({
  __esModule: true,
  default: ({ component }: any) => {
    const overrides = component.styles ? JSON.parse(component.styles) : {};
    const color = overrides.color?.fg;
    return (
      <div data-cy={`block-${component.id}`} style={{ color }}>
        {component.type}
      </div>
    );
  },
}));

jest.mock("@ui/components/cms/blocks", () => ({
  blockRegistry: {
    Text: { component: (props: any) => <div {...props} /> },
  },
  atomRegistry: {
    Text: { component: (props: any) => <div {...props} />, previewImage: "" },
  },
  moleculeRegistry: {},
  organismRegistry: {},
  containerRegistry: {},
  layoutRegistry: {},
  overlayRegistry: {},
}));

// Legacy mocked suite kept for reference; superseded by pb/pageBuilder.real.integration.test.tsx.
// Increase timeout: the builder mounts several async subtrees
jest.setTimeout(30000);

describe.skip("PageBuilder integration (legacy mocked)", () => {
  it("adds, reorders, deletes blocks and updates styles", async () => {
    const user = userEvent.setup();
    let componentsState: any[] = [];
    const onChange = jest.fn((c) => {
      componentsState = c;
    });

    const page = {
      id: "p1",
      slug: "slug",
      updatedAt: "2024-01-01",
      status: "draft",
      seo: { title: { en: "" }, description: {} },
      components: [],
    } as any;

    render(
      <PageBuilder
        page={page}
        onSave={async () => {}}
        onPublish={async () => {}}
        onChange={onChange}
      />,
    );

    // Add first block
    await user.click(screen.getByText("Add Block"));
    await waitFor(() => expect(componentsState).toHaveLength(1));
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    const firstId = componentsState[0].id;

    // Open design tab (contains StylePanel) and change foreground color
    // New sidebar groups styling under "Design" instead of a separate "Style" accordion
    await user.click(screen.getByText("Design"));
    const fgInput = screen.getByLabelText("cms.style.foreground");
    // eslint-disable-next-line ds/no-raw-color
    await user.type(fgInput, "#123456");
    await act(async () => {});
    // eslint-disable-next-line ds/no-raw-color
    expect(fgInput).toHaveValue("#123456");
    const blockEl = await screen.findByTestId(`block-${firstId}`);
    // eslint-disable-next-line ds/no-raw-color
    expect(blockEl).toHaveStyle({ color: "#123456" });

    const undo = screen.getByRole("button", { name: "Undo" });
    expect(undo).not.toBeDisabled();

    // Add second block
    await user.click(screen.getByText("Add Block"));
    await waitFor(() => expect(componentsState).toHaveLength(2));
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    // Delete the first block
    const firstItemId = componentsState[0].id;

    const firstItem = screen.getAllByRole("listitem")[0];
    await user.click(within(firstItem).getByRole("button"));
    expect(screen.getAllByRole("listitem")).toHaveLength(1);

    // Undo restores deleted block
    await user.click(undo);
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });
});
