"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";

import type { Business, Card, Lane, Priority } from "@/lib/types";

import {
  type CardEditorFormData,
  cardEditorSchema,
  formDataToApiPayload,
} from "./schema";

interface CardEditorFormProps {
  businesses: Business[];
  existingCard?: Card;
  mode: "create" | "edit";
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

/* eslint-disable ds/no-hardcoded-copy, ds/no-unsafe-viewport-units, ds/enforce-layout-primitives, ds/no-raw-tailwind-color, complexity, max-lines-per-function -- BOS-32: Phase 0 scaffold form UI with many fields (ttl: 2026-03-31) */
export function CardEditorForm({
  businesses,
  existingCard,
  mode,
}: CardEditorFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultValues: Partial<CardEditorFormData> = existingCard
    ? {
        business: existingCard.Business || "",
        title: existingCard.Title || extractTitle(existingCard.content),
        description: extractDescription(existingCard.content),
        lane: existingCard.Lane,
        priority: existingCard.Priority,
        owner: existingCard.Owner,
        proposedLane: existingCard["Proposed-Lane"] || "",
        tags: existingCard.Tags?.join(", ") || "",
        dueDate: existingCard["Due-Date"] || "",
      }
    : {
        business: "",
        title: "",
        description: "",
        lane: "Inbox" as Lane,
        priority: "P2" as Priority,
        owner: "Pete", // Phase 0: Pete-only
        proposedLane: "",
        tags: "",
        dueDate: "",
      };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CardEditorFormData>({
    resolver: zodResolver(cardEditorSchema),
    defaultValues,
  });

  const onSubmit = async (data: CardEditorFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = formDataToApiPayload(data);

      if (mode === "create") {
        const response = await fetch("/api/cards", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to create card");
        }

        const result = await response.json();
        router.push(`/cards/${result.cardId}`);
      } else {
        // Edit mode
        const response = await fetch(`/api/cards/${existingCard!.ID}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to update card");
        }

        router.push(`/cards/${existingCard!.ID}`);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Failed to ${mode === "create" ? "create" : "update"} card`
      );
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Business Selection */}
      <div>
        <label
          htmlFor="business"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Business *
        </label>
        <select
          id="business"
          {...register("business")}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus:border-blue-500"
          disabled={isSubmitting || mode === "edit"}
        >
          <option value="">Select a business...</option>
          {businesses.map((business) => (
            <option key={business.id} value={business.id}>
              {business.name} ({business.id})
            </option>
          ))}
        </select>
        {errors.business && (
          <p className="mt-1 text-sm text-red-600">{errors.business.message}</p>
        )}
      </div>

      {/* Title */}
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Title *
        </label>
        <input
          id="title"
          type="text"
          {...register("title")}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus:border-blue-500"
          placeholder="Brief, descriptive title"
          disabled={isSubmitting}
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Description *
        </label>
        <textarea
          id="description"
          {...register("description")}
          rows={8}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus:border-blue-500"
          placeholder="Detailed description. You can use markdown formatting."
          disabled={isSubmitting}
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">
            {errors.description.message}
          </p>
        )}
      </div>

      {/* Lane and Priority Row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="lane"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Lane *
          </label>
          <select
            id="lane"
            {...register("lane")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus:border-blue-500"
            disabled={isSubmitting}
          >
            <option value="Inbox">Inbox</option>
            <option value="Fact-finding">Fact-finding</option>
            <option value="Planned">Planned</option>
            <option value="In progress">In progress</option>
            <option value="Blocked">Blocked</option>
            <option value="Done">Done</option>
            <option value="Reflected">Reflected</option>
          </select>
          {errors.lane && (
            <p className="mt-1 text-sm text-red-600">{errors.lane.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="priority"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Priority *
          </label>
          <select
            id="priority"
            {...register("priority")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus:border-blue-500"
            disabled={isSubmitting}
          >
            <option value="P0">P0 (Critical)</option>
            <option value="P1">P1 (High)</option>
            <option value="P2">P2 (Medium)</option>
            <option value="P3">P3 (Low)</option>
            <option value="P4">P4 (Very Low)</option>
            <option value="P5">P5 (Backlog)</option>
          </select>
          {errors.priority && (
            <p className="mt-1 text-sm text-red-600">{errors.priority.message}</p>
          )}
        </div>
      </div>

      {/* Owner and Proposed Lane Row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="owner"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Owner *
          </label>
          <input
            id="owner"
            type="text"
            {...register("owner")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus:border-blue-500"
            placeholder="Owner name"
            disabled={isSubmitting}
          />
          {errors.owner && (
            <p className="mt-1 text-sm text-red-600">{errors.owner.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="proposedLane"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Proposed Lane (optional)
          </label>
          <select
            id="proposedLane"
            {...register("proposedLane")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus:border-blue-500"
            disabled={isSubmitting}
          >
            <option value="">None</option>
            <option value="Inbox">Inbox</option>
            <option value="Fact-finding">Fact-finding</option>
            <option value="Planned">Planned</option>
            <option value="In progress">In progress</option>
            <option value="Blocked">Blocked</option>
            <option value="Done">Done</option>
            <option value="Reflected">Reflected</option>
          </select>
          {errors.proposedLane && (
            <p className="mt-1 text-sm text-red-600">
              {errors.proposedLane.message}
            </p>
          )}
        </div>
      </div>

      {/* Tags and Due Date Row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="tags"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Tags (optional)
          </label>
          <input
            id="tags"
            type="text"
            {...register("tags")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., feature, bug, improvement (comma-separated)"
            disabled={isSubmitting}
          />
          {errors.tags && (
            <p className="mt-1 text-sm text-red-600">{errors.tags.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="dueDate"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Due Date (optional)
          </label>
          <input
            id="dueDate"
            type="date"
            {...register("dueDate")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus:border-blue-500"
            disabled={isSubmitting}
          />
          {errors.dueDate && (
            <p className="mt-1 text-sm text-red-600">{errors.dueDate.message}</p>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting
            ? mode === "create"
              ? "Creating..."
              : "Saving..."
            : mode === "create"
              ? "Create Card"
              : "Save Changes"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          disabled={isSubmitting}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
