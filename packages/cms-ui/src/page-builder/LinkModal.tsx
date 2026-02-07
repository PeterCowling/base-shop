"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
} from "@acme/design-system/shadcn";

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
  // i18n-exempt — editor-only link modal copy
  const t = (s: string) => s;
  const [value, setValue] = useState(initialUrl ?? "");
  const valid = useMemo(() => isValidHref(value), [value]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) setValue(initialUrl ?? "");
  }, [open, initialUrl]);

  useEffect(() => {
    if (!open) return;
    // Defer focus until dialog content mounts for better a11y than autoFocus
    const id = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(id);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(o) => (!o ? onClose() : undefined)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("Insert Link")}</DialogTitle>
          <DialogDescription>{t("Enter a valid URL or path")}</DialogDescription>
        </DialogHeader>
        <div className="flex items-end gap-2">
          <div className="grow">
            <Input
              ref={inputRef}
              value={value}
              placeholder={t("https://example.com or /page")}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
          <Button type="button" variant="outline" onClick={() => setPickerOpen(true)}>
            {t("Pick Internal")}
          </Button>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {t("Cancel")}
          </Button>
          <Button
            type="button"
            onClick={() => valid && onSave(value.trim())}
            disabled={!valid}
          >
            {t("Save")}
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
