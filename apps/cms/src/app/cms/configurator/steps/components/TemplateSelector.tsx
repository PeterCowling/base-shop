"use client";

import { useState } from "react";
import Image from "next/image";
import { ulid } from "ulid";
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ui/components/atoms/shadcn";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@ui/components/atoms";
import type { PageComponent } from "@acme/types";

interface Template {
  name: string;
  components: PageComponent[];
  preview: string;
}

interface Props {
  pageTemplates: Template[];
  layout: string;
  onSelect: (layout: string, components: PageComponent[]) => void;
}

export default function TemplateSelector({
  pageTemplates,
  layout,
  onSelect,
}: Props): React.JSX.Element {
  const [selectOpen, setSelectOpen] = useState(false);
  const [pendingTemplate, setPendingTemplate] = useState<Template | null>(null);

  return (
    <>
      <Select
        data-cy="product-layout"
        value={layout}
        open={selectOpen}
        onOpenChange={setSelectOpen}
        onValueChange={() => {}}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select template" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem
            value="blank"
            asChild
            onSelect={(e) => {
              e.preventDefault();
              setSelectOpen(false);
              setPendingTemplate({ name: "blank", components: [], preview: "" });
            }}
          >
            <button type="button" data-cy="template-blank" className="w-full text-left">
              Blank
            </button>
          </SelectItem>
          {pageTemplates.map((t) => (
            <SelectItem
              key={t.name}
              value={t.name}
              asChild
              onSelect={(e) => {
                e.preventDefault();
                setSelectOpen(false);
                setPendingTemplate(t);
              }}
            >
              <button
                type="button"
                data-cy={`template-${t.name.replace(/\s+/g, '-')}`}
                className="w-full text-left"
              >
                <div className="flex items-center gap-2">
                  <Image
                    src={t.preview}
                    alt={`${t.name} preview`}
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded object-cover"
                  />
                  {t.name}
                </div>
              </button>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Dialog
        open={!!pendingTemplate}
        onOpenChange={(o: boolean) => {
          if (!o) setPendingTemplate(null);
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              Use
              {pendingTemplate?.name === "blank"
                ? " Blank"
                : ` ${pendingTemplate?.name}`}
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
            <Button
              data-cy="cancel-template"
              variant="outline"
              onClick={() => setPendingTemplate(null)}
            >
              Cancel
            </Button>
            <Button
              data-cy="confirm-template"
              onClick={() => {
                if (!pendingTemplate) return;
                const layout =
                  pendingTemplate.name === "blank" ? "" : pendingTemplate.name;
                const comps = pendingTemplate.components.map((c) => ({
                  ...c,
                  id: ulid(),
                }));
                onSelect(layout, comps);
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

