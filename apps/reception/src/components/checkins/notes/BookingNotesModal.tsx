import { type FC, memo, useCallback, useState } from "react";

import { Textarea } from "@acme/design-system";
import { Button } from "@acme/design-system/atoms";
import { SimpleModal } from "@acme/ui/molecules";

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

  const sorted = Object.entries(notes).sort((a, b) =>
    a[1].timestamp.localeCompare(b[1].timestamp)
  );

  return (
    <SimpleModal
      isOpen={true}
      onClose={onClose}
      title="Booking Notes"
      maxWidth="max-w-md"
      footer={
        <div className="flex justify-end gap-2">
          <Button
            className="px-4 py-2 bg-surface-3 text-foreground rounded-lg"
            onClick={onClose}
          >
            Close
          </Button>
          <Button
            className="px-4 py-2 bg-primary text-primary-fg rounded-lg"
            onClick={handleAdd}
          >
            Add Note
          </Button>
        </div>
      }
    >
      <div className="max-h-64 overflow-y-auto mb-4 space-y-2">
        {sorted.length === 0 && <p className="italic">No notes</p>}
        {sorted.map(([id, note]) => (
          <div key={id} className="border p-2 rounded-lg space-y-1">
            <div className="text-xs text-muted-foreground">
              {formatEnGbDateTimeFromIso(note.timestamp)} - {note.user}
            </div>
            {editingId === id ? (
              <>
                <Textarea
                  compatibilityMode="no-wrapper"
                  className="w-full border rounded-lg p-1 text-foreground"
                  rows={2}
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    className="px-2 py-1 bg-surface-3 text-foreground rounded-lg"
                    onClick={() => {
                      setEditingId(null);
                      setEditText("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="px-2 py-1 bg-primary text-primary-fg rounded-lg"
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
      <Textarea
        compatibilityMode="no-wrapper"
        className="w-full border rounded-lg p-2 mb-2 text-foreground"
        rows={3}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
    </SimpleModal>
  );
};

export default memo(BookingNotesModal);
