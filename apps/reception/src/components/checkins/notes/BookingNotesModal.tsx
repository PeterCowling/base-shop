import { type FC, type KeyboardEvent, memo, useCallback, useState } from "react";

import { Button } from "@acme/design-system/atoms";
import { ReceptionTextarea } from "@acme/ui/operations";

import useBookingNotes from "../../../hooks/data/useBookingNotes";
import useBookingNotesMutation from "../../../hooks/mutations/useBookingNotesMutation";
import { formatEnGbDateTimeFromIso } from "../../../utils/dateUtils";

interface Props {
  bookingRef: string;
  onClose: () => void;
}

const BookingNotesModal: FC<Props> = ({ bookingRef, onClose }) => {
  const { notes } = useBookingNotes(bookingRef);
  const { addNote, updateNote, deleteNote } = useBookingNotesMutation();
  const [text, setText] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState<string>("");

  const handleAdd = useCallback(async () => {
    if (!text.trim()) return;
    await addNote(bookingRef, text);
    setText("");
  }, [addNote, bookingRef, text]);

  const handleUpdate = useCallback(async () => {
    if (!editingId) return;
    await updateNote(bookingRef, editingId, editText);
    setEditingId(null);
    setEditText("");
  }, [updateNote, bookingRef, editingId, editText]);

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteNote(bookingRef, id);
      if (editingId === id) {
        setEditingId(null);
        setEditText("");
      }
    },
    [deleteNote, bookingRef, editingId]
  );

  // Close modal on Enter or Space on the backdrop for accessibility.
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        onClose();
      }
    },
    [onClose]
  );

  const sorted = Object.entries(notes).sort((a, b) =>
    a[1].timestamp.localeCompare(b[1].timestamp)
  );

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div
        className="absolute inset-0 bg-foreground opacity-50"
        onClick={onClose}
        role="button"
        tabIndex={0}
        onKeyDown={handleKeyDown}
      />
      <div className="bg-surface rounded-lg shadow-lg z-10 p-4 w-11/12 max-w-md dark:bg-darkSurface dark:text-darkAccentGreen">
        <h2 className="text-xl font-bold mb-4">Booking Notes</h2>
        <div className="max-h-64 overflow-y-auto mb-4 space-y-2">
          {sorted.length === 0 && <p className="italic">No notes</p>}
          {sorted.map(([id, note]) => (
            <div key={id} className="border p-2 rounded space-y-1">
              <div className="text-xs text-muted-foreground dark:text-darkAccentGreen">
                {formatEnGbDateTimeFromIso(note.timestamp)} - {note.user}
              </div>
              {editingId === id ? (
                <>
                  <ReceptionTextarea
                    className="w-full border rounded p-1 text-foreground dark:text-darkAccentGreen"
                    rows={2}
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      className="px-2 py-1 bg-surface-3 text-foreground rounded dark:bg-darkSurface dark:hover:bg-darkSurface/70 dark:text-darkAccentGreen"
                      onClick={() => {
                        setEditingId(null);
                        setEditText("");
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="px-2 py-1 bg-primary-main text-primary-fg rounded dark:bg-darkAccentGreen dark:text-darkBg dark:hover:bg-darkAccentGreen/80"
                      onClick={handleUpdate}
                    >
                      Save
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex justify-between items-start">
                  <div className="whitespace-pre-wrap break-words me-2">
                    {note.text}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="text-info-main text-sm"
                      onClick={() => {
                        setEditingId(id);
                        setEditText(note.text);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      className="text-error-main text-sm"
                      onClick={() => handleDelete(id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        <ReceptionTextarea
          className="w-full border rounded p-2 mb-2 text-foreground dark:text-darkAccentGreen"
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="flex justify-end gap-2">
          <Button
            className="px-4 py-2 bg-surface-3 text-foreground rounded dark:bg-darkSurface dark:hover:bg-darkSurface/70 dark:text-darkAccentGreen"
            onClick={onClose}
          >
            Close
          </Button>
          <Button
            className="px-4 py-2 bg-primary-main text-primary-fg rounded dark:bg-darkAccentGreen dark:text-darkBg dark:hover:bg-darkAccentGreen/80"
            onClick={handleAdd}
          >
            Add Note
          </Button>
        </div>
      </div>
    </div>
  );
};

export default memo(BookingNotesModal);
