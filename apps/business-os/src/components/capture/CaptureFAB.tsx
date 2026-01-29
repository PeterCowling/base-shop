/**
 * CaptureFAB Component
 * Floating Action Button for quick idea capture on mobile
 * BOS-UX-14
 */

/* eslint-disable ds/enforce-layout-primitives, ds/no-arbitrary-tailwind -- BOS-UX-14: Phase 0 scaffold UI */
"use client";

import { useState } from "react";

import { QuickCaptureModal } from "./QuickCaptureModal";

export function CaptureFAB() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      {/* Floating Action Button - Mobile Only */}
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        aria-label="Capture idea"
        className="fixed bottom-6 right-6 z-50 inline-flex items-center justify-center h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors md:hidden"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
      </button>

      {/* Quick Capture Modal */}
      <QuickCaptureModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
