"use client";

import { useMemo, useState } from "react";
import { type FieldErrors, useForm,type UseFormRegister } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button, FormField, Input, Textarea } from "@acme/design-system/atoms";
import { useTranslations } from "@acme/i18n";

import { ConflictDialog } from "@/components/ConflictDialog";
import {
  getErrorField,
  getRecordField,
  getStringField,
  isRecord,
  safeReadJson,
} from "@/lib/json";
import type { Business, Card, Lane, Priority } from "@/lib/types";

import {
  type CardEditorFormData,
  createCardEditorSchema,
  formDataToApiPayload,
} from "./schema";

interface CardEditorFormProps {
  businesses: Business[];
  existingCard?: Card;
  mode: "create" | "edit";
  baseFileSha?: string;
}

const LANE_SET = {
  Inbox: true,
  "Fact-finding": true,
  Planned: true,
  "In progress": true,
  Blocked: true,
  Done: true,
  Reflected: true,
} satisfies Record<Lane, true>;

const PRIORITY_SET = {
  P0: true,
  P1: true,
  P2: true,
  P3: true,
  P4: true,
  P5: true,
} satisfies Record<Priority, true>;

function isLane(value: unknown): value is Lane {
  return typeof value === "string" && value in LANE_SET;
}

function isPriority(value: unknown): value is Priority {
  return typeof value === "string" && value in PRIORITY_SET;
}

function isCard(value: unknown): value is Card {
  if (!isRecord(value)) {
    return false;
  }

  return (
    value.Type === "Card" &&
    typeof value.ID === "string" &&
    isLane(value.Lane) &&
    isPriority(value.Priority) &&
    typeof value.Owner === "string" &&
    typeof value.content === "string" &&
    typeof value.filePath === "string"
  );
}

// Extract title from existing card content (first # heading)
function extractTitle(content: string): string {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1] : "";
}

// Extract description from existing card content (everything after first heading)
function extractDescription(content: string): string {
  const lines = content.split("\n");
  const firstHeadingIndex = lines.findIndex((line) => line.startsWith("# "));
  if (firstHeadingIndex === -1) return content;
  return lines
    .slice(firstHeadingIndex + 1)
    .join("\n")
    .trim();
}

const SELECT_CLASS_NAME =
  "w-full rounded-md border border-input bg-input px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-[var(--ring-width)] focus-visible:ring-offset-[var(--ring-offset-width)] focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

function buildDefaultValues(
  existingCard: Card | undefined,
  t: (key: string) => string
): Partial<CardEditorFormData> {
  if (existingCard) {
    return {
      business: existingCard.Business || "",
      title: existingCard.Title || extractTitle(existingCard.content),
      description: extractDescription(existingCard.content),
      lane: existingCard.Lane,
      priority: existingCard.Priority,
      owner: existingCard.Owner,
      proposedLane: existingCard["Proposed-Lane"] || "",
      tags: existingCard.Tags?.join(", ") || "",
      dueDate: existingCard["Due-Date"] || "",
    };
  }

  return {
    business: "",
    title: "",
    description: "",
    lane: "Inbox" as Lane,
    priority: "P2" as Priority,
    owner: t("businessOs.cardEditor.defaults.owner"),
    proposedLane: "",
    tags: "",
    dueDate: "",
  };
}

function buildLaneOptions(t: (key: string) => string): Array<{ value: Lane; label: string }> {
  return [
    { value: "Inbox", label: t("businessOs.lanes.inbox") },
    { value: "Fact-finding", label: t("businessOs.lanes.factFind") },
    { value: "Planned", label: t("businessOs.lanes.planned") },
    { value: "In progress", label: t("businessOs.lanes.inProgress") },
    { value: "Blocked", label: t("businessOs.lanes.blocked") },
    { value: "Done", label: t("businessOs.lanes.done") },
    { value: "Reflected", label: t("businessOs.lanes.reflected") },
  ];
}

function buildPriorityOptions(
  t: (key: string) => string
): Array<{ value: Priority; label: string }> {
  return [
    { value: "P0", label: t("businessOs.priorities.p0") },
    { value: "P1", label: t("businessOs.priorities.p1") },
    { value: "P2", label: t("businessOs.priorities.p2") },
    { value: "P3", label: t("businessOs.priorities.p3") },
    { value: "P4", label: t("businessOs.priorities.p4") },
    { value: "P5", label: t("businessOs.priorities.p5") },
  ];
}

type Translate = ReturnType<typeof useTranslations>;

interface CardEditorFormFieldsProps {
  businesses: Business[];
  errors: FieldErrors<CardEditorFormData>;
  register: UseFormRegister<CardEditorFormData>;
  isSubmitting: boolean;
  laneOptions: Array<{ value: Lane; label: string }>;
  mode: "create" | "edit";
  priorityOptions: Array<{ value: Priority; label: string }>;
  t: Translate;
}

function CardEditorFormFields({
  businesses,
  errors,
  register,
  isSubmitting,
  laneOptions,
  mode,
  priorityOptions,
  t,
}: CardEditorFormFieldsProps) {
  const businessRegister = register("business");
  const laneRegister = register("lane");
  const priorityRegister = register("priority");
  const proposedLaneRegister = register("proposedLane");

  return (
    <>
      {/* Business Selection */}
      <FormField
        label={t("businessOs.cardEditor.fields.business.label")}
        required
        error={errors.business?.message}
        input={({ id, describedBy, ariaInvalid }) => (
          <select
            id={id}
            {...businessRegister}
            aria-describedby={describedBy}
            aria-invalid={ariaInvalid}
            className={SELECT_CLASS_NAME}
            disabled={isSubmitting || mode === "edit"}
          >
            <option value="">
              {t("businessOs.cardEditor.fields.business.placeholder")}
            </option>
            {businesses.map((business) => (
              <option key={business.id} value={business.id}>
                {business.name} ({business.id})
              </option>
            ))}
          </select>
        )}
      />

      {/* Title */}
      <Input
        id="title"
        type="text"
        label={t("businessOs.cardEditor.fields.title.label")}
        placeholder={t("businessOs.cardEditor.fields.title.placeholder")}
        error={errors.title?.message}
        required
        disabled={isSubmitting}
        {...register("title")}
      />

      {/* Description */}
      <Textarea
        id="description"
        rows={8}
        label={t("businessOs.cardEditor.fields.description.label")}
        placeholder={t("businessOs.cardEditor.fields.description.placeholder")}
        error={errors.description?.message}
        required
        disabled={isSubmitting}
        {...register("description")}
      />

      {/* Lane and Priority Row */}
      <div className="grid grid-cols-2 gap-4">
        <FormField
          label={t("businessOs.cardEditor.fields.lane.label")}
          required
          error={errors.lane?.message}
          input={({ id, describedBy, ariaInvalid }) => (
            <select
              id={id}
              {...laneRegister}
              aria-describedby={describedBy}
              aria-invalid={ariaInvalid}
              className={SELECT_CLASS_NAME}
              disabled={isSubmitting}
            >
              {laneOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
        />

        <FormField
          label={t("businessOs.cardEditor.fields.priority.label")}
          required
          error={errors.priority?.message}
          input={({ id, describedBy, ariaInvalid }) => (
            <select
              id={id}
              {...priorityRegister}
              aria-describedby={describedBy}
              aria-invalid={ariaInvalid}
              className={SELECT_CLASS_NAME}
              disabled={isSubmitting}
            >
              {priorityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
        />
      </div>

      {/* Owner and Proposed Lane Row */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          id="owner"
          type="text"
          label={t("businessOs.cardEditor.fields.owner.label")}
          placeholder={t("businessOs.cardEditor.fields.owner.placeholder")}
          error={errors.owner?.message}
          required
          disabled={isSubmitting}
          {...register("owner")}
        />

        <FormField
          label={t("businessOs.cardEditor.fields.proposedLane.label")}
          error={errors.proposedLane?.message}
          input={({ id, describedBy, ariaInvalid }) => (
            <select
              id={id}
              {...proposedLaneRegister}
              aria-describedby={describedBy}
              aria-invalid={ariaInvalid}
              className={SELECT_CLASS_NAME}
              disabled={isSubmitting}
            >
              <option value="">
                {t("businessOs.cardEditor.fields.proposedLane.none")}
              </option>
              {laneOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
        />
      </div>

      {/* Tags and Due Date Row */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          id="tags"
          type="text"
          label={t("businessOs.cardEditor.fields.tags.label")}
          placeholder={t("businessOs.cardEditor.fields.tags.placeholder")}
          error={errors.tags?.message}
          disabled={isSubmitting}
          {...register("tags")}
        />

        <Input
          id="dueDate"
          type="date"
          label={t("businessOs.cardEditor.fields.dueDate.label")}
          error={errors.dueDate?.message}
          disabled={isSubmitting}
          {...register("dueDate")}
        />
      </div>
    </>
  );
}

interface CardEditorFormActionsProps {
  isSubmitting: boolean;
  mode: "create" | "edit";
  onCancel: () => void;
  t: Translate;
}

function CardEditorFormActions({
  isSubmitting,
  mode,
  onCancel,
  t,
}: CardEditorFormActionsProps) {
  return (
    <div className="flex gap-4">
      <Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
        {isSubmitting
          ? mode === "create"
            ? t("businessOs.cardEditor.actions.creating")
            : t("businessOs.cardEditor.actions.saving")
          : mode === "create"
            ? t("businessOs.cardEditor.actions.create")
            : t("businessOs.cardEditor.actions.save")}
      </Button>
      <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
        {t("businessOs.cardEditor.actions.cancel")}
      </Button>
    </div>
  );
}

export function CardEditorForm({
  businesses,
  existingCard,
  mode,
  baseFileSha,
}: CardEditorFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflictCard, setConflictCard] = useState<Card | null>(null);
  const [conflictSubmitted, setConflictSubmitted] = useState<CardEditorFormData | null>(null);

  const defaultValues = useMemo(
    () => buildDefaultValues(existingCard, t),
    [existingCard, t]
  );
  const laneOptions = useMemo(() => buildLaneOptions(t), [t]);
  const priorityOptions = useMemo(() => buildPriorityOptions(t), [t]);

  const schema = useMemo(() => createCardEditorSchema(t), [t]);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<CardEditorFormData>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const submit = async (params: { data: CardEditorFormData; force?: boolean }) => {
    setIsSubmitting(true);
    setError(null);
    setConflictCard(null);
    setConflictSubmitted(null);

    const isCreate = mode === "create";
    const submitErrorKey = isCreate
      ? "businessOs.cardEditor.errors.createFailed"
      : "businessOs.cardEditor.errors.updateFailed";

    try {
      if (!isCreate) {
        setConflictSubmitted(params.data);
      }

      const payload = formDataToApiPayload(params.data);
      const endpoint = isCreate ? "/api/cards" : `/api/cards/${existingCard!.ID}`;
      const response = await fetch(endpoint, {
        method: isCreate ? "POST" : "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          isCreate
            ? payload
            : {
                ...payload,
                baseFileSha,
                force: params.force === true ? true : undefined,
              }
        ),
      });

      if (!response.ok) {
        const errorData = await safeReadJson(response);

        if (!isCreate && response.status === 409) {
          const conflict = getRecordField(errorData, "conflict");
          const currentCard = conflict ? conflict["currentCard"] : null;
          if (isCard(currentCard)) {
            setConflictCard(currentCard);
            // i18n-exempt -- BOS-32 Phase 0 optimistic concurrency copy [ttl=2026-03-31]
            throw new Error(
              getErrorField(errorData) || "This card changed since you loaded it."
            );
          }
        }

        throw new Error(getErrorField(errorData) || t(submitErrorKey));
      }

      if (isCreate) {
        const result = await safeReadJson(response);
        const cardId = getStringField(result, "cardId");
        if (!cardId) {
          throw new Error(t(submitErrorKey));
        }
        router.push(`/cards/${cardId}`);
      } else {
        router.push(`/cards/${existingCard!.ID}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t(submitErrorKey));
      setIsSubmitting(false);
    }
  };

  const onSubmit = async (data: CardEditorFormData) => submit({ data });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <CardEditorFormFields
        businesses={businesses}
        errors={errors}
        register={register}
        isSubmitting={isSubmitting}
        laneOptions={laneOptions}
        mode={mode}
        priorityOptions={priorityOptions}
        t={t}
      />

      {/* Error Display */}
      {error && (
        <div className="rounded-md border border-danger bg-danger-soft p-4">
          <p className="text-sm text-danger-foreground">{error}</p>
        </div>
      )}

      {/* Conflict resolution (MVP-C3 spike) */}
      {conflictCard && existingCard && (
        <ConflictDialog
          currentMarkdown={`# ${conflictCard.Title || extractTitle(conflictCard.content)}\n\n${extractDescription(conflictCard.content)}`}
          submittedMarkdown={`# ${(conflictSubmitted?.title ?? getValues().title) || ""}\n\n${(conflictSubmitted?.description ?? getValues().description) || ""}`}
          isBusy={isSubmitting}
          onRefresh={() => router.refresh()}
          onOverwrite={async () => {
            const data = conflictSubmitted ?? getValues();
            await submit({ data, force: true });
          }}
        />
      )}

      <CardEditorFormActions
        isSubmitting={isSubmitting}
        mode={mode}
        onCancel={() => router.back()}
        t={t}
      />
    </form>
  );
}
