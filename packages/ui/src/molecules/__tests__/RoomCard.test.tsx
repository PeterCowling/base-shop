import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { RoomCardAction, RoomCardProps } from "../../types/roomCard";
import { ROOM_CARD_ACTION_BUTTON_CLASS,ROOM_CARD_TEST_IDS, RoomCard } from "../RoomCard";

const BASE_IMAGE_LABELS = {
  enlarge: "View image",
  prevAria: "Previous image",
  nextAria: "Next image",
  empty: "No image available",
};

function buildActions(overrides?: Partial<RoomCardAction>[]): RoomCardAction[] {
  const defaults: RoomCardAction[] = [
    { id: "nr", label: "Book NR", onSelect: jest.fn() },
    { id: "flex", label: "Book Flex", onSelect: jest.fn() },
  ];

  return overrides
    ? defaults.map((action, idx) => ({ ...action, ...(overrides[idx] ?? {}) }))
    : defaults;
}

function renderRoomCard(props?: Partial<RoomCardProps>) {
  const defaultActions = buildActions();
  const resolvedActions: RoomCardAction[] = props?.actions ?? defaultActions;
  const allProps: RoomCardProps = {
    id: "test-room",
    title: "Terrace Dorm",
    images: ["/images/one.jpg", "/images/two.jpg"],
    imageAlt: "Terrace dorm",
    imageLabels: BASE_IMAGE_LABELS,
    facilities: [
      {
        id: "wifi",
        label: "Fast Wi-Fi",
        icon: <span data-cy="wifi-icon" />,
      },
    ],
    price: {
      formatted: "From €80.00",
    },
    actions: resolvedActions,
    ...props,
  };

  render(<RoomCard {...allProps} />);

  return { actions: resolvedActions };
}

describe("RoomCard (design system)", () => {
  it("renders core fields and fires CTA callbacks", async () => {
    const user = userEvent.setup();
    const { actions } = renderRoomCard();

    expect(screen.getByRole("heading", { name: "Terrace Dorm" })).toBeInTheDocument();
    expect(screen.getByText("From €80.00")).toBeInTheDocument();
    expect(screen.getByTestId("wifi-icon")).toBeInTheDocument();

    const firstCta = screen.getByRole("button", { name: "Book NR" });
    ROOM_CARD_ACTION_BUTTON_CLASS.split(/\s+/).forEach((token) => {
      if (!token) return;
      expect(firstCta).toHaveClass(token);
    });

    await user.click(firstCta);
    expect(actions[0]?.onSelect).toHaveBeenCalledTimes(1);
  });

  it("renders a tooltip icon when price info is provided", () => {
    const note = "Per night, per guest";
    renderRoomCard({
      price: {
        formatted: "From €80.00",
        info: note,
      },
    });

    expect(screen.getByTitle(note)).toBeInTheDocument();
    expect(screen.getByText(note)).toHaveClass("sr-only");
  });

  it("shows price skeleton with sr-only copy when loading", () => {
    renderRoomCard({
      price: {
        loading: true,
        loadingLabel: "Loading latest rate",
      },
    });

    const skeleton = screen.getByTestId(ROOM_CARD_TEST_IDS.priceSkeleton);
    expect(skeleton).toBeInTheDocument();
    expect(screen.getByText("Loading latest rate")).toHaveClass("sr-only");
  });

  it("invokes fullscreen handler with current image payload", async () => {
    const user = userEvent.setup();
    const onRequestFullscreen = jest.fn();

    renderRoomCard({
      onRequestFullscreen,
    });

    await user.click(screen.getByRole("button", { name: BASE_IMAGE_LABELS.enlarge }));

    expect(onRequestFullscreen).toHaveBeenCalledWith(
      expect.objectContaining({
        image: "/img/one.jpg",
        index: 0,
        title: "Terrace Dorm",
      })
    );
  });

  it("cycles images via navigation controls", async () => {
    const user = userEvent.setup();
    renderRoomCard();

    const counter = () => screen.getByText(/2\/2/);

    await user.click(screen.getByRole("button", { name: BASE_IMAGE_LABELS.nextAria }));
    expect(counter()).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: BASE_IMAGE_LABELS.prevAria }));
    expect(screen.getByText(/1\/2/)).toBeInTheDocument();
  });

  it("splits hyphenated action labels across two lines", () => {
    renderRoomCard({
      actions: [
        { id: "nr", label: "Non-Refundable Rates – From €259.20", onSelect: jest.fn() },
      ],
    });

    const button = screen.getByRole("button", {
      name: "Non-Refundable Rates – From €259.20",
    });
    const lineSpans = button.querySelectorAll("span span");

    expect(lineSpans).toHaveLength(2);
    expect(lineSpans[0]).toHaveTextContent("Non-Refundable Rates");
    expect(lineSpans[1]).toHaveTextContent("From €259.20");
  });

  it("shows the provided empty-state label when no images exist", () => {
    renderRoomCard({
      images: [],
      imageLabels: { ...BASE_IMAGE_LABELS, empty: "Nessuna immagine" },
    });

    expect(screen.getByText("Nessuna immagine")).toBeInTheDocument();
  });
});
