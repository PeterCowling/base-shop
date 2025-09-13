"use client";

import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/shadcn";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/atoms";
import type { PageComponent } from "@acme/types";
import { ulid } from "ulid";
import { useState } from "react";
import Image from "next/image";
import type React from "react";

interface Template {
  name: string;
  components: PageComponent[];
  preview: string;
  disabled?: boolean;
}

interface Props {
  /** Currently selected layout name */
  value: string;
  /** Available templates to choose from */
  pageTemplates: Template[];
  /** Called with normalized layout name and components when confirmed */
  onConfirm: (layout: string, components: PageComponent[]) => void;
  /** Optional props for the SelectTrigger */
  triggerProps?: React.ComponentProps<typeof SelectTrigger> & {
    [key: `data-${string}`]: unknown;
  };
}

/**
 * Reusable selector for choosing a page template. Encapsulates the Radix select
 * with a confirmation dialog and returns newly generated component ids.
 */
export default function TemplateSelector({
  value,
  pageTemplates,
  onConfirm,
  triggerProps,
}: Props): React.JSX.Element {
  const [selectOpen, setSelectOpen] = useState(false);
  const [pendingTemplate, setPendingTemplate] = useState<Template | null>(null);

  return (
    <>
      <Select
        value={value}
        open={selectOpen}
        onOpenChange={setSelectOpen}
        onValueChange={() => {}}
      >
        <SelectTrigger className="w-full" {...triggerProps}>
          <SelectValue placeholder="Select template" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem
            value="blank"
            asChild
            onSelect={(e: React.SyntheticEvent<unknown>) => {
              e.preventDefault();
              setSelectOpen(false);
              setPendingTemplate({ name: "blank", components: [], preview: "" });
            }}
          >
            <button type="button" className="w-full text-left">
              Blank
            </button>
          </SelectItem>
          {pageTemplates.map((t) => (
            <SelectItem
              key={t.name}
              value={t.name}
              asChild
              disabled={t.disabled}
              onSelect={(e: React.SyntheticEvent<unknown>) => {
                if (t.disabled) return;
                e.preventDefault();
                setSelectOpen(false);
                setPendingTemplate(t);
              }}
            >
              <button
                type="button"
                className="w-full text-left"
                disabled={t.disabled}
              >
                <div className="flex items-center gap-2">
                  {t.preview && (
                    <Image
                      src={t.preview}
                      alt={`${t.name} preview`}
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded object-cover"
                    />
                  )}
                  {t.name}
                </div>
              </button>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Dialog
        open={!!pendingTemplate}
        onOpenChange={(open: boolean) => !open && setPendingTemplate(null)}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              Use
              {pendingTemplate?.name === "blank" ? " Blank" : ` ${pendingTemplate?.name}`}
              {" "}template?
            </DialogTitle>
          </DialogHeader>
          {pendingTemplate?.preview && (
            <Image
              src={pendingTemplate.preview}
              alt={`${pendingTemplate.name} preview`}
              width={800}
              height={600}
              sizes="100vw"
              className="w-full rounded"
            />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingTemplate(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!pendingTemplate) return;
                const layout =
                  pendingTemplate.name === "blank" ? "" : pendingTemplate.name;
                const comps = pendingTemplate.components.map((c) => ({
                  ...c,
                  id: ulid(),
                }));
                onConfirm(layout, comps);
                setPendingTemplate(null);
              }}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

