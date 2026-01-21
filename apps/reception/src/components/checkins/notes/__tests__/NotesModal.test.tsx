import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const addNote = jest.fn();
const updateNote = jest.fn();
const deleteNote = jest.fn();

jest.mock("../../../../hooks/data/useBookingNotes", () => ({
  __esModule: true,
  default: jest.fn(() => ({
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

jest.mock("../../../../hooks/mutations/useBookingNotesMutation", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    addNote,
    updateNote,
    deleteNote,
  })),
}));

jest.mock("../../../../utils/dateUtils", async () => {
  const actual = jest.requireActual("../../../../utils/dateUtils");
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

  const renderModal = (onClose = jest.fn()) =>
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
    const onClose = jest.fn();
    renderModal(onClose);
    await userEvent.click(screen.getByText("Close"));
    expect(onClose).toHaveBeenCalled();
  });
});

