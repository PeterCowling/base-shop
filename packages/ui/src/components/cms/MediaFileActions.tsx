"use client";

import type { CheckedState } from "@radix-ui/react-checkbox";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import type { MouseEvent } from "react";
import { useTranslations } from "@acme/i18n";

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
  const t = useTranslations();
  const handleOverlayClick = (event: MouseEvent) => {
    event.stopPropagation();
  };

  return (
    <div className="relative">
      {selectionEnabled ? (
        <div className="absolute start-3 top-3">
          <Checkbox
            checked={selected}
            onCheckedChange={onBulkToggle}
            onClick={handleOverlayClick}
            aria-label={selected ? (t("cms.media.deselect") as string) : (t("cms.media.select") as string)}
            disabled={actionsDisabled}
          />
        </div>
      ) : null}

      <div className="absolute end-3 top-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="h-9 w-9 rounded-full p-0"
              aria-label={t("cms.media.actions") as string}
              onClick={handleOverlayClick}
              disabled={actionsDisabled}
            >
              {actionsLoading ? (
                renderLoadingContent(t("cms.actions") as string, true, statusMessage)
              ) : (
                <DotsHorizontalIcon className="h-4 w-4" aria-hidden="true" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>{t("cms.actions")}</DropdownMenuLabel>
            {onViewDetails ? (
              <DropdownMenuItem
                onSelect={() => {
                  if (!actionsDisabled) onViewDetails();
                }}
                disabled={actionsDisabled}
              >
                {t("cms.media.viewDetails")}
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem
              onSelect={() => {
                if (!actionsDisabled) onReplaceRequest();
              }}
              disabled={actionsDisabled}
              className="gap-2"
              aria-label={replaceInProgress ? (t("cms.media.replacing") as string) : (t("cms.media.replace") as string)}
            >
              {renderLoadingContent(t("cms.replace") as string, replaceInProgress, t("cms.media.replacing") as string)}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => {
                if (actionsDisabled || deleteInProgress) return;
                onDeleteRequest();
              }}
              disabled={actionsDisabled}
              className="gap-2"
              aria-label={deleteInProgress ? (t("cms.media.deleting") as string) : (t("cms.media.delete") as string)}
            >
              {renderLoadingContent(t("cms.delete") as string, deleteInProgress, t("cms.media.deleting") as string)}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="absolute inset-x-3 bottom-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
        {onOpenDetails ? (
          <Button
            type="button"
            variant="outline"
            className="h-9 flex-1 rounded-md text-sm gap-2"
            onClick={(event) => {
              handleOverlayClick(event);
              if (!actionsDisabled) onOpenDetails();
            }}
            disabled={actionsDisabled}
            aria-label={t("cms.media.openDetails") as string}
          >
            {renderLoadingContent(t("cms.media.openDetails") as string, actionsLoading, statusMessage)}
          </Button>
        ) : null}
        {onSelectItem ? (
          <Button
            type="button"
            variant="ghost"
            className="h-9 rounded-md px-3 text-sm gap-2"
            onClick={(event) => {
              handleOverlayClick(event);
              if (!actionsDisabled) onSelectItem();
            }}
            disabled={actionsDisabled}
            aria-label={t("cms.media.select") as string}
          >
            {renderLoadingContent(t("cms.select") as string, actionsLoading, statusMessage)}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
