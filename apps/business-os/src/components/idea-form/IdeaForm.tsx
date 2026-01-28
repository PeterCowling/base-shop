"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";

import type { Business } from "@/lib/types";

import { type CreateIdeaFormData,createIdeaSchema } from "./schema";

interface IdeaFormProps {
  businesses: Business[];
}

/* eslint-disable ds/no-hardcoded-copy -- BOS-13: Phase 0 scaffold form UI (ttl: 2026-03-31) */
export function IdeaForm({ businesses }: IdeaFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateIdeaFormData>({
    resolver: zodResolver(createIdeaSchema),
    defaultValues: {
      business: "",
      title: "",
      description: "",
      tags: "",
    },
  });

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
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create idea");
      }

      const result = await response.json();

      // Redirect to the created idea
      router.push(`/ideas/${result.ideaId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create idea");
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
          disabled={isSubmitting}
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
          placeholder="Brief, descriptive title for your idea"
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
          placeholder="Describe your idea. You can use markdown formatting."
          disabled={isSubmitting}
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">
            {errors.description.message}
          </p>
        )}
      </div>

      {/* Tags */}
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
          placeholder="e.g., feature, improvement, research (comma-separated)"
          disabled={isSubmitting}
        />
        {errors.tags && (
          <p className="mt-1 text-sm text-red-600">{errors.tags.message}</p>
        )}
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
          {isSubmitting ? "Creating..." : "Create Idea"}
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
