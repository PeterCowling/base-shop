"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@acme/design-system/atoms";

import useSingleGuestDetails from "../../../hooks/data/useSingleGuestDetails";
import useActivitiesMutations from "../../../hooks/mutations/useActivitiesMutations";
import { PageShell } from "../../common/PageShell";

import BookingRef from "./BookingRef";
import { occupantIsComplete } from "./occupantCompleteHelpers";
import Row1 from "./row1";
import Row2 from "./row2";
import Row3 from "./row3";

interface SnackbarState {
  open: boolean;
  message: string;
  severity: "success" | "error" | "warning" | "info";
}

const DocInsertPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Retrieve bookingRef & occupantId, plus the selectedDate from URL params
  const bookingRef = searchParams.get("bookingRef") ?? "";
  const occupantId = searchParams.get("occupantId") ?? "";
  const preSelectedDate = searchParams.get("selectedDate") ?? "";

  const handleBack = useCallback(() => {
    const params = preSelectedDate ? `?selectedDate=${encodeURIComponent(preSelectedDate)}` : "";
    router.push(`/checkin${params}`);
  }, [router, preSelectedDate]);

  // Load occupant details & save capabilities
  const { occupantDetails, loading, error, saveField } = useSingleGuestDetails(
    bookingRef,
    occupantId
  );

  // Track whether we've already logged code=11 for this occupant
  const hasLoggedCompleteRef = useRef(false);

  // Snackbar handling
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: "",
    severity: "success",
  });

  const closeSnackbar = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  // For logging "activities"
  const { logActivity } = useActivitiesMutations();

  // Hide the snackbar automatically after a few seconds
  useEffect(() => {
    if (snackbar.open) {
      const timer = setTimeout(() => {
        setSnackbar((prev) => ({ ...prev, open: false }));
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [snackbar.open]);

  // Check occupant completeness on every occupantDetails update
  useEffect(() => {
    if (!occupantDetails) return;

    const isComplete = occupantIsComplete(occupantDetails);

    // If occupant is complete and we haven't logged code=11 yet, log it
    if (isComplete && !hasLoggedCompleteRef.current) {
      hasLoggedCompleteRef.current = true;
      try {
        const maybePromise = logActivity(occupantId, 11);
        if (maybePromise && typeof (maybePromise as Promise<void>).catch === "function") {
          (maybePromise as Promise<void>).catch((err) => {
            console.error(
              "[DocInsertPage occupantCompleteEffect] Failed to log code=11:",
              err
            );
          });
        }
      } catch (err) {
        console.error(
          "[DocInsertPage occupantCompleteEffect] Failed to log code=11:",
          err
        );
      }
    }

    // If occupant becomes incomplete (for example, user changes a field back to empty),
    // you can decide whether to reset hasLoggedCompleteRef here or not.
    // In many use cases, we only want to log once, so we leave it as is.
    // If you want to allow re-logging when occupant toggles from incomplete -> complete again,
    // you could reset `hasLoggedCompleteRef.current = false;` if !isComplete.
  }, [occupantDetails, occupantId, logActivity]);

  if (loading) {
    return (
      <PageShell title="Insert Guest Details">
        <p className="text-muted-foreground">Loading guest details...</p>
      </PageShell>
    );
  }
  if (error) {
    return (
      <PageShell title="Insert Guest Details">
        <p className="text-error-main">
          Error: {error instanceof Error ? error.message : String(error)}
        </p>
      </PageShell>
    );
  }
  if (!occupantDetails) {
    return (
      <PageShell title="Insert Guest Details">
        <p className="text-error-main">No occupant details found.</p>
      </PageShell>
    );
  }

  return (
    <PageShell title="Insert Guest Details">
      {/* Back button */}
      <div className="flex justify-end mb-4">
        <Button
          onClick={handleBack}
          color="primary"
          tone="solid"
        >
          <span className="me-2">&larr;</span>
          Back
        </Button>
      </div>

      <div className="bg-surface rounded-lg shadow-xl px-8 py-12">
        {/* BookingRef component */}
        <div className="mb-50px">
          <BookingRef bookingRef={bookingRef} />
        </div>

        {/* Three separate rows for personal details */}
        <Row1
          occupantDetails={occupantDetails}
          saveField={saveField}
          setSnackbar={setSnackbar}
        />
        <Row2 occupantDetails={occupantDetails} saveField={saveField} />
        <Row3
          occupantDetails={occupantDetails}
          saveField={saveField}
          setSnackbar={setSnackbar}
        />
      </div>

      {/* Snackbar-like feedback */}
      {snackbar.open && (
        <div
          className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-md
            flex items-center justify-between w-72
            ${
              snackbar.severity === "success"
                ? "bg-success-light/50 text-primary-fg"
                : snackbar.severity === "error"
                ? "bg-error-main/50 text-primary-fg"
                : snackbar.severity === "warning"
                ? "bg-warning-main/50 text-foreground"
                : "bg-primary-main/50 text-primary-fg"
            }`}
        >
          <span>{snackbar.message}</span>
          <Button onClick={closeSnackbar} color="default" tone="ghost" className="ms-4">
            ×
          </Button>
        </div>
      )}
    </PageShell>
  );
};

export default DocInsertPage;
