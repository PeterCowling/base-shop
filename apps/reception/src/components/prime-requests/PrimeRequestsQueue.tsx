"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@acme/design-system/atoms";

import usePrimeRequestsData from "../../hooks/data/usePrimeRequestsData";
import usePrimeRequestResolution from "../../hooks/mutations/usePrimeRequestResolution";
import type {
  PrimeRequestRecord,
  PrimeRequestStatus,
  PrimeRequestType,
} from "../../types/hooks/data/primeRequestsData";

const STATUS_ORDER: PrimeRequestStatus[] = [
  "pending",
  "approved",
  "declined",
  "completed",
];

const TYPE_LABELS: Record<PrimeRequestType, string> = {
  extension: "Extension",
  bag_drop: "Bag Drop",
  meal_change_exception: "Meal Change Exception",
};

const STATUS_LABELS: Record<PrimeRequestStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  declined: "Declined",
  completed: "Completed",
};

function formatTimestamp(value: number): string {
  if (!Number.isFinite(value) || value <= 0) {
    return "Unknown";
  }

  return new Date(value).toLocaleString("en-GB", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function readString(payload: Record<string, unknown> | undefined, key: string) {
  const raw = payload?.[key];
  return typeof raw === "string" ? raw : null;
}

function renderContextSummary(request: PrimeRequestRecord): string {
  if (request.type === "extension") {
    const current = readString(request.payload, "currentCheckOutDate");
    const requested = readString(request.payload, "requestedCheckOutDate");
    if (current && requested) {
      return `Checkout ${current} -> ${requested}`;
    }
  }

  if (request.type === "bag_drop") {
    const pickupWindow = readString(request.payload, "pickupWindow");
    if (pickupWindow) {
      return `Pickup window: ${pickupWindow}`;
    }
  }

  if (request.type === "meal_change_exception") {
    const service = readString(request.payload, "service");
    const serviceDate = readString(request.payload, "serviceDate");
    const requestedValue = readString(request.payload, "requestedValue");
    if (service && serviceDate && requestedValue) {
      return `${service} on ${serviceDate}: ${requestedValue}`;
    }
  }

  return "No additional request context";
}

function contextLinkForType(type: PrimeRequestType) {
  if (type === "extension") {
    return { href: "/extension", label: "Open Extension Desk" };
  }
  if (type === "bag_drop") {
    return { href: "/checkout", label: "Open Checkout Desk" };
  }
  return { href: "/bar", label: "Open Bar Desk" };
}

export default function PrimeRequestsQueue() {
  const { requests, byStatus, loading, error } = usePrimeRequestsData();
  const { resolveRequest, isResolving, error: resolveError } =
    usePrimeRequestResolution();
  const [selectedStatusFilter, setSelectedStatusFilter] =
    useState<PrimeRequestStatus>("pending");
  const [nextStatusByRequest, setNextStatusByRequest] = useState<
    Record<string, PrimeRequestStatus>
  >({});
  const [noteByRequest, setNoteByRequest] = useState<Record<string, string>>({});
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);

  const visibleRequests = useMemo(() => {
    if (selectedStatusFilter === "pending") {
      return byStatus.pending;
    }
    return requests.filter((request) => request.status === selectedStatusFilter);
  }, [byStatus.pending, requests, selectedStatusFilter]);

  async function handleApply(request: PrimeRequestRecord) {
    const nextStatus = nextStatusByRequest[request.requestId] ?? request.status;
    const note = noteByRequest[request.requestId] ?? "";

    setActiveRequestId(request.requestId);
    try {
      await resolveRequest({
        request,
        nextStatus,
        resolutionNote: note,
      });
      setNoteByRequest((previous) => ({
        ...previous,
        [request.requestId]: "",
      }));
    } finally {
      setActiveRequestId(null);
    }
  }

  return (
    <div className="min-h-80vh bg-gray-100 p-4 font-sans text-gray-800 dark:bg-darkBg dark:text-darkAccentGreen">
      <h1 className="mb-6 w-full text-center font-heading text-5xl text-primary-main">
        PRIME REQUESTS
      </h1>

      <div className="rounded-lg bg-white p-6 shadow dark:bg-darkSurface">
        <p className="mb-4 text-sm text-gray-600 dark:text-darkAccentGreen">
          Resolve Prime guest requests while keeping booking/preorder/check-out
          flows as the canonical source of truth.
        </p>

        <div className="mb-4 flex flex-wrap gap-2">
          {STATUS_ORDER.map((status) => (
            <Button
              key={status}
              type="button"
              onClick={() => setSelectedStatusFilter(status)}
              className={`rounded px-3 py-1.5 text-xs font-semibold ${
                selectedStatusFilter === status
                  ? "bg-primary-main text-white"
                  : "bg-gray-200 text-gray-700 dark:bg-darkBorder dark:text-darkAccentGreen"
              }`}
            >
              {STATUS_LABELS[status]}
            </Button>
          ))}
        </div>

        {loading && (
          <p className="italic text-gray-600 dark:text-darkAccentGreen">
            Loading Prime requests...
          </p>
        )}

        {!loading && error && (
          <p className="font-semibold text-red-600">
            Error loading Prime requests: {String(error)}
          </p>
        )}

        {!loading && !error && visibleRequests.length === 0 && (
          <p className="italic text-gray-600 dark:text-darkAccentGreen">
            No {STATUS_LABELS[selectedStatusFilter].toLowerCase()} requests.
          </p>
        )}

        {!loading && !error && visibleRequests.length > 0 && (
          <div className="overflow-auto">
            <Table
              className="min-w-full border-collapse text-sm"
              aria-label="Prime requests queue"
            >
              <TableHeader>
                <TableRow className="bg-gray-200 dark:bg-darkBorder">
                  <TableHead className="border-b p-2 text-left">Type</TableHead>
                  <TableHead className="border-b p-2 text-left">Guest</TableHead>
                  <TableHead className="border-b p-2 text-left">Booking</TableHead>
                  <TableHead className="border-b p-2 text-left">Submitted</TableHead>
                  <TableHead className="border-b p-2 text-left">Context</TableHead>
                  <TableHead className="border-b p-2 text-left">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleRequests.map((request) => {
                  const contextLink = contextLinkForType(request.type);
                  const selectedStatus =
                    nextStatusByRequest[request.requestId] ?? request.status;
                  const isBusy =
                    isResolving && activeRequestId === request.requestId;

                  return (
                    <TableRow key={request.requestId} className="bg-white dark:bg-darkSurface">
                      <TableCell className="border-b p-2 align-top font-semibold">
                        {TYPE_LABELS[request.type]}
                        <p className="mt-1 text-xs font-normal text-gray-500 dark:text-gray-400">
                          Current: {STATUS_LABELS[request.status]}
                        </p>
                      </TableCell>
                      <TableCell className="border-b p-2 align-top">
                        <p className="font-medium">{request.guestName}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {request.guestUuid}
                        </p>
                      </TableCell>
                      <TableCell className="border-b p-2 align-top">
                        <p className="font-medium">{request.bookingId}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {request.requestId}
                        </p>
                      </TableCell>
                      <TableCell className="border-b p-2 align-top">
                        {formatTimestamp(request.submittedAt)}
                      </TableCell>
                      <TableCell className="border-b p-2 align-top">
                        <p>{renderContextSummary(request)}</p>
                        {request.note && (
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Guest note: {request.note}
                          </p>
                        )}
                        <Link
                          className="mt-2 inline-block text-xs font-semibold text-primary-main hover:underline"
                          href={contextLink.href}
                        >
                          {contextLink.label}
                        </Link>
                      </TableCell>
                      <TableCell className="border-b p-2 align-top">
                        <div className="flex min-w-220px flex-col gap-2">
                          <select
                            aria-label={`Status for ${request.requestId}`}
                            value={selectedStatus}
                            onChange={(event) =>
                              setNextStatusByRequest((previous) => ({
                                ...previous,
                                [request.requestId]:
                                  event.target.value as PrimeRequestStatus,
                              }))
                            }
                            className="rounded border px-2 py-1 dark:bg-darkSurface dark:border-darkBorder"
                          >
                            {STATUS_ORDER.map((status) => (
                              <option key={status} value={status}>
                                {STATUS_LABELS[status]}
                              </option>
                            ))}
                          </select>

                          <input
                            aria-label={`Resolution note for ${request.requestId}`}
                            value={noteByRequest[request.requestId] ?? ""}
                            onChange={(event) =>
                              setNoteByRequest((previous) => ({
                                ...previous,
                                [request.requestId]: event.target.value,
                              }))
                            }
                            placeholder="Optional operator note"
                            className="rounded border px-2 py-1 dark:bg-darkSurface dark:border-darkBorder"
                          />

                          <Button
                            type="button"
                            onClick={() => handleApply(request)}
                            disabled={isBusy}
                            className="rounded bg-primary-main px-3 py-1.5 text-white disabled:opacity-60"
                          >
                            {isBusy ? "Applying..." : "Apply"}
                          </Button>

                          {request.resolution && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Last by {request.resolution.operatorName} at{" "}
                              {formatTimestamp(request.resolution.resolvedAt)}
                            </p>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {resolveError && (
          <p className="mt-4 font-semibold text-red-600">
            Failed to apply request action: {String(resolveError)}
          </p>
        )}
      </div>
    </div>
  );
}
