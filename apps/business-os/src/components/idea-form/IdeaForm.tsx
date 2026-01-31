"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button, FormField, Input, Textarea } from "@acme/design-system/atoms";
import { useTranslations } from "@acme/i18n";

import { getErrorField, getStringField, safeReadJson } from "@/lib/json";
import type { Business } from "@/lib/types";

import { type CreateIdeaFormData, createIdeaSchema } from "./schema";

interface IdeaFormProps {
  businesses: Business[];
}

export function IdeaForm({ businesses }: IdeaFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations();
  const schema = useMemo(() => createIdeaSchema(t), [t]);
  const selectClassName =
    "w-full rounded-md border border-input bg-input px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-[var(--ring-width)] focus-visible:ring-offset-[var(--ring-offset-width)] focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateIdeaFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      business: "",
      title: "",
      description: "",
      tags: "",
    },
  });

  const businessRegister = register("business");

  const onSubmit = async (data: CreateIdeaFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Combine title and description into markdown content
      const content = `# ${data.title}\n\n${data.description}`;

      // Parse tags from comma-separated string
      const tags = data.tags
        ?.split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

      const response = await fetch("/api/ideas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          business: data.business,
          content,
          tags,
        }),
      });

      if (!response.ok) {
        const errorData = await safeReadJson(response);
        throw new Error(
          getErrorField(errorData) || t("businessOs.ideaForm.errors.createFailed")
        );
      }

      const result = await safeReadJson(response);
      const ideaId = getStringField(result, "ideaId");
      if (!ideaId) {
        throw new Error(t("businessOs.ideaForm.errors.createFailed"));
      }

      // Redirect to the created idea
      router.push(`/ideas/${ideaId}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t("businessOs.ideaForm.errors.createFailed")
      );
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Business Selection */}
      <FormField
        label={t("businessOs.ideaForm.fields.business.label")}
        required
        error={errors.business?.message}
        input={({ id, describedBy, ariaInvalid }) => (
          <select
            id={id}
            {...businessRegister}
            aria-describedby={describedBy}
            aria-invalid={ariaInvalid}
            className={selectClassName}
            disabled={isSubmitting}
          >
            <option value="">
              {t("businessOs.ideaForm.fields.business.placeholder")}
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
        label={t("businessOs.ideaForm.fields.title.label")}
        placeholder={t("businessOs.ideaForm.fields.title.placeholder")}
        error={errors.title?.message}
        required
        disabled={isSubmitting}
        {...register("title")}
      />

      {/* Description */}
      <Textarea
        id="description"
        rows={8}
        label={t("businessOs.ideaForm.fields.description.label")}
        placeholder={t("businessOs.ideaForm.fields.description.placeholder")}
        error={errors.description?.message}
        required
        disabled={isSubmitting}
        {...register("description")}
      />

      {/* Tags */}
      <Input
        id="tags"
        type="text"
        label={t("businessOs.ideaForm.fields.tags.label")}
        placeholder={t("businessOs.ideaForm.fields.tags.placeholder")}
        error={errors.tags?.message}
        disabled={isSubmitting}
        {...register("tags")}
      />

      {/* Error Display */}
      {error && (
        <div className="rounded-md border border-danger bg-danger-soft p-4">
          <p className="text-sm text-danger-foreground">{error}</p>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex gap-4">
        <Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
          {isSubmitting
            ? t("businessOs.ideaForm.actions.creating")
            : t("businessOs.ideaForm.actions.create")}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          {t("businessOs.ideaForm.actions.cancel")}
        </Button>
      </div>
    </form>
  );
}
