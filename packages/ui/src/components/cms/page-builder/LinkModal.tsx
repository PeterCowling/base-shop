"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
} from "../../atoms/shadcn";
import LinkPicker from "./LinkPicker";

function isValidHref(href: string): boolean {
  if (!href) return false;
  // Allow http/https, protocol-relative, mailto, tel, and relative paths with anchors
  const patterns = [
    /^(https?:)\/\//i,
    /^(mailto:)/i,
    /^(tel:)/i,
    /^\//, // absolute path
    /^#\w+/, // anchor
    /^(\.\.?)\//, // relative path
  ];
  return patterns.some((re) => re.test(href.trim()));
}

export default function LinkModal({
  open,
  initialUrl,
  onClose,
  onSave,
}: {
  open: boolean;
  initialUrl?: string;
  onClose: () => void;
  onSave: (href: string) => void;
}) {
  const [value, setValue] = useState(initialUrl ?? "");
  const valid = useMemo(() => isValidHref(value), [value]);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (open) setValue(initialUrl ?? "");
  }, [open, initialUrl]);

  return (
    <Dialog open={open} onOpenChange={(o) => (!o ? onClose() : undefined)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Insert Link</DialogTitle>
          <DialogDescription>Enter a valid URL or path</DialogDescription>
        </DialogHeader>
        <div className="flex items-end gap-2">
          <div className="grow">
            <Input
              value={value}
              placeholder="https://example.com or /page"
              onChange={(e) => setValue(e.target.value)}
              autoFocus
            />
          </div>
          <Button type="button" variant="outline" onClick={() => setPickerOpen(true)}>
            Pick Internal
          </Button>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => valid && onSave(value.trim())}
            disabled={!valid}
          >
            Save
          </Button>
        </DialogFooter>
        <LinkPicker
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onPick={(href) => {
            setValue(href);
            setPickerOpen(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
