import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

const addNote = vi.fn();
const updateNote = vi.fn();
const deleteNote = vi.fn();

vi.mock("../../../../hooks/data/useBookingNotes", () => ({
  __esModule: true,
  default: vi.fn(() => ({
    notes: {
      note1: {
        text: "Existing note",
        timestamp: "2024-01-01T10:00:00.000Z",
        user: "Alice",
      },
    },
    loading: false,
    error: null,
  })),
}));

vi.mock("../../../../hooks/mutations/useBookingNotesMutation", () => ({
  __esModule: true,
  default: vi.fn(() => ({
    addNote,
    updateNote,
    deleteNote,
  })),
}));

vi.mock("../../../../utils/dateUtils", async () => {
  const actual = await vi.importActual<
    typeof import("../../../../utils/dateUtils")
  >("../../../../utils/dateUtils");
  return {
    ...actual,
    formatEnGbDateTimeFromIso: () => "formatted",
  };
});

import BookingNotesModal from "../BookingNotesModal";

describe("BookingNotesModal", () => {
  beforeEach(() => {
    addNote.mockClear();
    updateNote.mockClear();
  });

  const renderModal = (onClose = vi.fn()) =>
    render(<BookingNotesModal bookingRef="BR123" onClose={onClose} />);

  it("renders existing notes", () => {
    renderModal();
    expect(screen.getByText("Existing note")).toBeInTheDocument();
    expect(screen.getByText(/formatted/)).toBeInTheDocument();
    expect(screen.getByText(/Alice/)).toBeInTheDocument();
  });

  it("adds a new note", async () => {
    renderModal();
    const input = screen.getByRole("textbox");
    await userEvent.type(input, "New note");
    await userEvent.click(screen.getByText("Add Note"));
    expect(addNote).toHaveBeenCalledWith("BR123", "New note");
    expect(input).toHaveValue("");
  });

  it("saves an edited note", async () => {
    renderModal();
    await userEvent.click(screen.getByText("Edit"));
    const editArea = screen.getByDisplayValue("Existing note");
    await userEvent.clear(editArea);
    await userEvent.type(editArea, "Updated note");
    await userEvent.click(screen.getByText("Save"));
    expect(updateNote).toHaveBeenCalledWith("BR123", "note1", "Updated note");
    expect(screen.queryByText("Save")).not.toBeInTheDocument();
  });

  it("closes the modal", async () => {
    const onClose = vi.fn();
    renderModal(onClose);
    await userEvent.click(screen.getByText("Close"));
    expect(onClose).toHaveBeenCalled();
  });
});

