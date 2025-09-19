"use client";

import type { CheckedState } from "@radix-ui/react-checkbox";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import type { MouseEvent } from "react";

import {
  Button,
  Checkbox,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../atoms/shadcn";
import { Spinner } from "../atoms";

interface MediaFileActionsProps {
  actionsDisabled: boolean;
  actionsLoading: boolean;
  deleteInProgress: boolean;
  replaceInProgress: boolean;
  statusMessage: string;
  selectionEnabled?: boolean;
  selected?: boolean;
  onBulkToggle?: (checked: CheckedState) => void;
  onOpenDetails?: () => void;
  onSelectItem?: () => void;
  onViewDetails?: () => void;
  onReplaceRequest: () => void;
  onDeleteRequest: () => void;
}

function renderLoadingContent(label: string, loading: boolean, status?: string) {
  if (!loading) return label;
  const srText = status ?? `${label}…`;
  return (
    <>
      <Spinner className="h-4 w-4" aria-hidden="true" />
      <span className="sr-only">{srText}</span>
    </>
  );
}

export function MediaFileActions({
  actionsDisabled,
  actionsLoading,
  deleteInProgress,
  replaceInProgress,
  statusMessage,
  selectionEnabled,
  selected,
  onBulkToggle,
  onOpenDetails,
  onSelectItem,
  onViewDetails,
  onReplaceRequest,
  onDeleteRequest,
}: MediaFileActionsProps) {
  const handleOverlayClick = (event: MouseEvent) => {
    event.stopPropagation();
  };

  return (
    <>
      {selectionEnabled ? (
        <div className="absolute left-3 top-3 z-20" onClick={handleOverlayClick}>
          <Checkbox
            checked={selected}
            onCheckedChange={onBulkToggle}
            aria-label={selected ? "Deselect media" : "Select media"}
            disabled={actionsDisabled}
          />
        </div>
      ) : null}

      <div className="absolute right-3 top-3 z-20 flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="h-9 w-9 rounded-full p-0 flex items-center justify-center"
              aria-label="Media actions"
              onClick={handleOverlayClick}
              disabled={actionsDisabled}
            >
              {actionsLoading ? (
                renderLoadingContent("Actions", true, statusMessage)
              ) : (
                <DotsHorizontalIcon className="h-4 w-4" aria-hidden="true" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            {onViewDetails ? (
              <DropdownMenuItem
                onSelect={() => {
                  if (!actionsDisabled) onViewDetails();
                }}
                disabled={actionsDisabled}
              >
                View details
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem
              onSelect={() => {
                if (!actionsDisabled) onReplaceRequest();
              }}
              disabled={actionsDisabled}
              className="flex items-center gap-2"
              aria-label={replaceInProgress ? "Replacing media" : "Replace"}
            >
              {renderLoadingContent("Replace", replaceInProgress, "Replacing media…")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => {
                if (actionsDisabled || deleteInProgress) return;
                onDeleteRequest();
              }}
              disabled={actionsDisabled}
              className="flex items-center gap-2"
              aria-label={deleteInProgress ? "Deleting media" : "Delete"}
            >
              {renderLoadingContent("Delete", deleteInProgress, "Deleting media…")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="absolute inset-x-3 bottom-3 z-20 flex items-center justify-between gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
        {onOpenDetails ? (
          <Button
            type="button"
            variant="outline"
            className="h-9 flex-1 rounded-md text-sm flex items-center justify-center gap-2"
            onClick={(event) => {
              handleOverlayClick(event);
              if (!actionsDisabled) onOpenDetails();
            }}
            disabled={actionsDisabled}
            aria-label="Open details"
          >
            {renderLoadingContent("Open details", actionsLoading, statusMessage)}
          </Button>
        ) : null}
        {onSelectItem ? (
          <Button
            type="button"
            variant="ghost"
            className="h-9 rounded-md px-3 text-sm flex items-center justify-center gap-2"
            onClick={(event) => {
              handleOverlayClick(event);
              if (!actionsDisabled) onSelectItem();
            }}
            disabled={actionsDisabled}
            aria-label="Select media"
          >
            {renderLoadingContent("Select", actionsLoading, statusMessage)}
          </Button>
        ) : null}
      </div>
    </>
  );
}
