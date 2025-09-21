"use client";

import type { FormEventHandler, ReactNode } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
  Card,
  CardContent,
  Input,
} from "@/components/atoms/shadcn";
import { Toast } from "@/components/atoms";

import type { EditorSectionConfig } from "../editorSections";

interface HiddenFieldConfig {
  readonly name: string;
  readonly value: string;
}

interface EditorToastState {
  readonly open: boolean;
  readonly status: "success" | "error";
  readonly message: string;
}

export interface EditorSectionsAccordionProps {
  readonly sections: readonly EditorSectionConfig[];
  readonly onSubmit: FormEventHandler<HTMLFormElement>;
  readonly saving: boolean;
  readonly toast: EditorToastState;
  readonly onToastClose: () => void;
  readonly hiddenFields?: readonly HiddenFieldConfig[];
}

export default function EditorSectionsAccordion({
  sections,
  onSubmit,
  saving,
  toast,
  onToastClose,
  hiddenFields,
}: EditorSectionsAccordionProps) {
  const defaultOpenSections = sections.map((section) => section.key);
  const toastClassName =
    toast.status === "error"
      ? "bg-destructive text-destructive-foreground"
      : "bg-success text-success-fg";

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {hiddenFields?.map((field) => (
        <Input
          key={field.name}
          type="hidden"
          name={field.name}
          value={field.value}
        />
      ))}
      <Accordion
        type="multiple"
        defaultValue={defaultOpenSections}
        className="space-y-3"
      >
        {sections.map(({ key, title, description, component: Component, props, wrapWithCard }) => (
          <AccordionItem key={key} value={key} data-section={key} className="border-none">
            <AccordionTrigger className="rounded-md border border-border-3 bg-muted/40 px-4 py-3 text-left text-sm font-semibold">
              <SectionHeader title={title} description={description} />
            </AccordionTrigger>
            <AccordionContent className="pt-3">
              <SectionCard dataSectionKey={key} wrapWithCard={wrapWithCard}>
                <Component {...(props as unknown as Record<string, unknown>)} />
              </SectionCard>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <div className="flex justify-end">
        <Button
          className="h-10 px-6 text-sm font-semibold"
          disabled={saving}
          type="submit"
        >
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
      <Toast
        open={toast.open}
        message={toast.message}
        onClose={onToastClose}
        className={toastClassName}
        role="status"
      />
    </form>
  );
}

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-sm font-semibold">{title}</span>
      {description ? (
        <span className="text-xs text-muted-foreground">{description}</span>
      ) : null}
    </div>
  );
}

function SectionCard({
  children,
  dataSectionKey,
  wrapWithCard = true,
}: {
  children: ReactNode;
  dataSectionKey?: string;
  wrapWithCard?: boolean;
}) {
  if (!wrapWithCard) {
    return <div data-section={dataSectionKey}>{children}</div>;
  }

  return (
    <Card className="border border-border-3" data-section={dataSectionKey}>
      <CardContent className="space-y-6 p-6">{children}</CardContent>
    </Card>
  );
}
