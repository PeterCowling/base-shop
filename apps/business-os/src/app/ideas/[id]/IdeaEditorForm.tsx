"use client";

/**
 * IdeaEditorForm component
 * Inline editor for idea content with markdown preview
 */

/* eslint-disable ds/no-hardcoded-copy, ds/min-tap-size -- BOS-12: Phase 0 scaffold UI */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button, Textarea } from "@acme/design-system/atoms";

import { MarkdownContent } from "@/components/card-detail/MarkdownContent";

import { updateIdea } from "./actions";

const ideaEditorSchema = z.object({
  content: z.string().min(10, "Content must be at least 10 characters"),
});

type IdeaEditorFormData = z.infer<typeof ideaEditorSchema>;

export interface IdeaEditorFormProps {
  ideaId: string;
  initialContent: string;
  initialStatus: string;
  onCancel: () => void;
  onSuccess: () => void;
}

export function IdeaEditorForm({
  ideaId,
  initialContent,
  onCancel,
  onSuccess,
}: IdeaEditorFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<IdeaEditorFormData>({
    resolver: zodResolver(ideaEditorSchema),
    defaultValues: {
      content: initialContent,
    },
  });

  const content = watch("content");

  const onSubmit = async (data: IdeaEditorFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await updateIdea(ideaId, data.content);

      if (!result.success) {
        setError(result.errorKey || "Failed to update idea");
        setIsSubmitting(false);
        return;
      }

      // Success - call onSuccess callback
      onSuccess();
    } catch {
      setError("An unexpected error occurred");
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Preview Toggle */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Edit Idea</h3>
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {showPreview ? "Edit" : "Preview"}
        </button>
      </div>

      {/* Content Editor or Preview */}
      {showPreview ? (
        <div className="border border-gray-200 rounded-md p-4 bg-white min-h-96">
          <MarkdownContent content={content || ""} />
        </div>
      ) : (
        <div>
          <Textarea
            id="content"
            rows={20}
            placeholder="Write your idea content in markdown..."
            disabled={isSubmitting}
            error={errors.content?.message}
            {...register("content")}
          />
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="rounded-md border border-danger bg-danger-soft p-3">
          <p className="text-sm text-danger-foreground">{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={isSubmitting || showPreview}
          aria-busy={isSubmitting}
        >
          {isSubmitting ? "Saving..." : "Save as Worked Idea"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
