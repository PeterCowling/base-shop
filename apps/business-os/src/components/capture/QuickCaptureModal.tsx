/**
 * QuickCaptureModal Component
 * Simplified modal for capturing ideas quickly
 * BOS-UX-13
 */

/* eslint-disable ds/no-hardcoded-copy, ds/container-widths-only-at, ds/absolute-parent-guard, ds/no-nonlayered-zindex, max-lines-per-function -- BOS-UX-13: Phase 0 quick capture scaffold [ttl=2026-03-31] */
"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import Link from "next/link";
import * as DialogPrimitive from "@radix-ui/react-dialog";

import { Button, Input, Textarea } from "@acme/design-system/atoms";
import {
  Dialog,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@acme/design-system/primitives";

import { getErrorField, getStringField, safeReadJson } from "@/lib/json";
import type { Priority } from "@/lib/types";

export interface QuickCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultBusiness?: string;
}

interface FormData {
  title: string;
  business: string;
  priority: Priority;
  notes: string;
}

const INITIAL_FORM_DATA: FormData = {
  title: "",
  business: "PLAT",
  priority: "P2",
  notes: "",
};

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: "P0", label: "P0 - Critical" },
  { value: "P1", label: "P1 - High" },
  { value: "P2", label: "P2 - Normal" },
  { value: "P3", label: "P3 - Low" },
  { value: "P4", label: "P4 - Very Low" },
  { value: "P5", label: "P5 - Backlog" },
];

export function QuickCaptureModal({
  isOpen,
  onClose,
  defaultBusiness = "PLAT",
}: QuickCaptureModalProps) {
  const [formData, setFormData] = useState<FormData>({
    ...INITIAL_FORM_DATA,
    business: defaultBusiness,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedIdeaId, setSubmittedIdeaId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/ideas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title,
          business: formData.business,
          priority: formData.priority,
          content: formData.notes,
        }),
      });

      if (!response.ok) {
        const errorData = await safeReadJson(response);
        throw new Error(getErrorField(errorData) || "Failed to create idea");
      }

      const result = await safeReadJson(response);
      const ideaId = getStringField(result, "ideaId");
      if (!ideaId) {
        throw new Error("Failed to create idea");
      }

      setSubmittedIdeaId(ideaId);
      toast.success("Idea created!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create idea");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddAnother = () => {
    setFormData({ ...INITIAL_FORM_DATA, business: defaultBusiness });
    setSubmittedIdeaId(null);
  };

  const handleClose = () => {
    setFormData({ ...INITIAL_FORM_DATA, business: defaultBusiness });
    setSubmittedIdeaId(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogPortal>
        <DialogOverlay className="bg-black/50 backdrop-blur-sm" />
        <DialogPrimitive.Content
          className="fixed top-1/2 start-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-background text-foreground shadow-lg focus:outline-none"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <DialogTitle className="text-xl font-semibold">
              Quick Capture
            </DialogTitle>
            <DialogPrimitive.Close
              className="inline-flex items-center justify-center min-h-10 min-w-10 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close modal"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </DialogPrimitive.Close>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            {!submittedIdeaId ? (
              <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <Input
            id="title"
            type="text"
            label="Title"
            placeholder="What's your idea?"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            autoFocus
            disabled={isSubmitting}
          />

          {/* Business */}
          <div>
            <label htmlFor="business" className="block text-sm font-medium text-foreground mb-1">
              Business
            </label>
            <select
              id="business"
              value={formData.business}
              onChange={(e) => setFormData({ ...formData, business: e.target.value })}
              disabled={isSubmitting}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="PLAT">Platform</option>
              <option value="BRIK">Brikette</option>
              <option value="CMS">CMS</option>
            </select>
          </div>

          {/* Priority */}
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-foreground mb-1">
              Priority
            </label>
            <select
              id="priority"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
              disabled={isSubmitting}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              {PRIORITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <Textarea
            id="notes"
            label="Notes"
            placeholder="Additional details (optional)"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={4}
            disabled={isSubmitting}
          />

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !formData.title.trim()}
            >
              {isSubmitting ? "Capturing..." : "Capture"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          {/* Success message */}
          <div className="rounded-md bg-success-soft p-4 text-center">
            <p className="text-sm font-medium text-success-foreground">
              Idea created successfully!
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Link
              href={`/ideas/${submittedIdeaId}`}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              onClick={handleClose}
            >
              View idea
            </Link>
            <Button
              type="button"
              variant="outline"
              onClick={handleAddAnother}
              autoFocus
            >
              Add another
            </Button>
          </div>
        </div>
      )}
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
