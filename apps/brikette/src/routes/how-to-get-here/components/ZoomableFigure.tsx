import { memo } from "react";
import clsx from "clsx";
import type { TFunction } from "i18next";
import { ZoomIn } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@acme/design-system/primitives";

import { CfImage } from "@/components/images/CfImage";

export type ZoomableFigureProps = {
  t: TFunction<"howToGetHere">;
  src: string;
  alt: string;
  caption?: string;
  preset?: "gallery" | "hero";
  aspect?: string;
  className?: string;
};

const TRIGGER_CLASS = ["group", "w-full", "text-start"].join(" ");

function ZoomableFigureBase({
  t,
  src,
  alt,
  caption,
  preset = "gallery",
  aspect = "4/3",
  className,
}: ZoomableFigureProps) {
  const trimmedCaption = caption?.trim();
  const trimmedAlt = alt.trim();
  const title = trimmedCaption || trimmedAlt || t("lightbox.titleFallback");
  const ariaLabel = trimmedCaption
    ? t("lightbox.openAriaWithCaption", { caption: trimmedCaption })
    : t("lightbox.openAria");

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className={clsx(TRIGGER_CLASS, className)}
          aria-label={ariaLabel}
        >
          <figure className="relative overflow-hidden rounded-2xl border border-brand-outline/20 bg-brand-outline/5 shadow-sm dark:border-brand-outline/30">
            <CfImage
              src={src}
              alt={alt}
              preset={preset}
              className="size-full object-cover"
              data-aspect={aspect}
            />
            <span
              aria-hidden
              className="pointer-events-none absolute end-3 top-3 inline-flex size-9 items-center justify-center rounded-full bg-brand-surface/80 text-brand-heading shadow-sm backdrop-blur transition group-hover:bg-brand-surface dark:bg-brand-surface/60 dark:text-brand-surface"
            >
              <ZoomIn className="size-4" />
            </span>
            {caption ? (
              <figcaption className="bg-brand-surface px-4 py-3 text-sm text-brand-text/80 dark:bg-brand-surface/70 dark:text-brand-surface/80">
                {caption}
              </figcaption>
            ) : null}
          </figure>
        </button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {caption ? <DialogDescription>{caption}</DialogDescription> : null}
        </DialogHeader>
        <div className="overflow-hidden rounded-2xl border border-brand-outline/20 bg-brand-outline/5 dark:border-brand-outline/30">
          <CfImage
            src={src}
            alt={alt}
            preset="hero"
            className="size-full object-cover"
            data-aspect={aspect}
            priority
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export const ZoomableFigure = memo(ZoomableFigureBase);
