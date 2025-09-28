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
import { Cluster } from "@/components/atoms/primitives/Cluster";
import { useTranslations } from "@acme/i18n";

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
  pageTemplates?: Template[];
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
  const t = useTranslations();
  const [selectOpen, setSelectOpen] = useState(false);
  const [pendingTemplate, setPendingTemplate] = useState<Template | null>(null);
  const templates = Array.isArray(pageTemplates) ? pageTemplates : [];

  return (
    <>
      <Select
        value={value}
        open={selectOpen}
        onOpenChange={setSelectOpen}
        onValueChange={() => {}}
      >
        <SelectTrigger className="w-full" {...triggerProps}>
          <SelectValue placeholder={t("cms.configurator.shopPage.selectTemplate")} />
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
            <button type="button" className="w-full min-h-11 min-w-11 text-start">
              {t("cms.configurator.shopPage.blank")}
            </button>
          </SelectItem>
          {templates.map((tpl) => (
            <SelectItem
              key={tpl.name}
              value={tpl.name}
              asChild
              disabled={tpl.disabled}
              onSelect={(e: React.SyntheticEvent<unknown>) => {
                if (tpl.disabled) return;
                e.preventDefault();
                setSelectOpen(false);
                setPendingTemplate(tpl);
              }}
            >
              <button
                type="button"
                className="w-full min-h-11 min-w-11 text-start"
                disabled={tpl.disabled}
              >
                <Cluster gap={2} alignY="center">
                  {tpl.preview && (
                    <Image
                      src={tpl.preview}
                      alt={t("cms.configurator.shopPage.previewAlt", { name: tpl.name })}
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded object-cover"
                    />
                  )}
                  {tpl.name}
                </Cluster>
              </button>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Dialog
        open={!!pendingTemplate}
        onOpenChange={(open: boolean) => !open && setPendingTemplate(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("cms.configurator.shopPage.useTemplateConfirm", {
                name:
                  pendingTemplate?.name === "blank"
                    ? (t("cms.configurator.shopPage.blank") as string)
                    : String(pendingTemplate?.name ?? ""),
              })}
            </DialogTitle>
          </DialogHeader>
          {pendingTemplate?.preview && (
            <Image
              src={pendingTemplate.preview}
              alt={t("cms.configurator.shopPage.previewAlt", { name: pendingTemplate.name })}
              width={800}
              height={600}
              sizes="100vw"
              className="w-full rounded"
            />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingTemplate(null)}>
              {t("actions.cancel")}
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
              {t("actions.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
