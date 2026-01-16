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
} from "@acme/ui/components/atoms/shadcn";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@acme/ui/components/atoms";
import { Inline } from "@acme/ui/components/atoms/primitives";
import { useTranslations } from "@acme/i18n";
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
  // i18n-exempt: testing identifiers only; not user-facing copy
  const CY_PRODUCT_LAYOUT = "product-layout" as const;
  const CY_TEMPLATE_BLANK = "template-blank" as const;
  const CY_CANCEL_TEMPLATE = "cancel-template" as const;
  const CY_CONFIRM_TEMPLATE = "confirm-template" as const;
  const [selectOpen, setSelectOpen] = useState(false);
  const [pendingTemplate, setPendingTemplate] = useState<Template | null>(null);
  const t = useTranslations();

  return (
    <>
      <Select
        data-cy={CY_PRODUCT_LAYOUT}
        value={layout}
        open={selectOpen}
        onOpenChange={setSelectOpen}
        onValueChange={() => {}}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={String(t("cms.templates.selectTemplate"))} />
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
            <button
              type="button"
              data-cy={CY_TEMPLATE_BLANK}
              className="w-full text-start min-h-11 min-w-11"
            >
              {t("cms.templates.blank")}
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
                className="w-full text-start min-h-11 min-w-11"
              >
                <Inline gap={2} alignY="center">
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
                </Inline>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("cms.templates.useTemplateQuestion", {
                template:
                  pendingTemplate?.name === "blank"
                    ? t("cms.templates.blank")
                    : (pendingTemplate?.name ?? ""),
              })}
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
              data-cy={CY_CANCEL_TEMPLATE}
              variant="outline"
              onClick={() => setPendingTemplate(null)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              data-cy={CY_CONFIRM_TEMPLATE}
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
              {t("common.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
