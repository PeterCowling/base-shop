import { z } from "zod";
import type { Translated } from "../Product";
import type { LayoutProps } from "./layout";
import { layoutSchema } from "./layout";
import type { PositioningProps } from "./positioning";
import { positioningSchema } from "./positioning";
import type { SpacingProps } from "./spacing";
import { spacingSchema } from "./spacing";

export type PageStatus = "draft" | "published";

export interface SeoMeta {
  title: Translated;
  description?: Translated;
  image?: Translated;
}

export interface PageComponentBase extends LayoutProps, PositioningProps, SpacingProps {
  id: string;
  type: string;
  /** Optional custom name used by editors */
  name?: string;
  /** Do not render this component on the canvas or preview */
  hidden?: boolean;
  /** Prevent moving/resizing/spacing adjustments on the canvas */
  locked?: boolean;
  /** Minimum number of items allowed for components with lists */
  minItems?: number;
  /** Maximum number of items allowed for components with lists */
  maxItems?: number;
  /** Explicit item counts for large screens */
  desktopItems?: number;
  /** Explicit item counts for medium screens */
  tabletItems?: number;
  /** Explicit item counts for small screens */
  mobileItems?: number;
  /** Action performed when component is clicked */
  clickAction?: "none" | "navigate" | "open-modal" | "scroll-to";
  /** Destination when using a navigation click action */
  href?: string;
  /** Optional modal HTML/text when using open-modal */
  modalHtml?: string;
  /** Simple animation applied on render */
  animation?:
    | "none"
    | "fade"
    | "slide"
    | "slide-up"
    | "slide-down"
    | "slide-left"
    | "slide-right"
    | "zoom"
    | "rotate";
  /** Animation duration in milliseconds */
  animationDuration?: number;
  /** Animation delay in milliseconds */
  animationDelay?: number;
  /** CSS easing function (e.g. 'ease', 'linear', 'cubic-bezier(...)') */
  animationEasing?: string;
  /** Reveal effect on scroll */
  reveal?:
    | "fade"
    | "slide-up"
    | "slide-down"
    | "slide-left"
    | "slide-right"
    | "zoom"
    | "rotate";
  /** Parallax factor (small decimal like 0.15..0.5) */
  parallax?: number;
  /** Sticky behavior */
  sticky?: "top" | "bottom";
  /** Sticky offset (e.g. 64px) */
  stickyOffset?: string | number;
  /** Hover transform scale (e.g. 1.05) */
  hoverScale?: number;
  /** Hover opacity (0..1) */
  hoverOpacity?: number;
  /** Stagger child reveal/transition in milliseconds */
  staggerChildren?: number;
  /** Optional multi-step motion timeline */
  timeline?: {
    /** When to start the timeline */
    trigger?: "load" | "click" | "in-view" | "scroll";
    /** Loop the timeline (non-scroll triggers) */
    loop?: boolean;
    /** Named style/preset reference (editor convenience) */
    name?: string;
    /** Steps for the timeline. For scroll trigger, `at` is 0..1 progress. For other triggers, steps run sequentially using `duration`. */
    steps?: Array<{
      /** For scroll trigger: progress 0..1. Optional for sequential timelines. */
      at?: number;
      /** Duration in ms for this step (sequential timelines). */
      duration?: number;
      /** CSS timing function (e.g. ease, linear, cubic-bezier(...)) */
      easing?: string;
      /** Opacity 0..1 */
      opacity?: number;
      /** Translate X in px */
      x?: number;
      /** Translate Y in px */
      y?: number;
      /** Scale factor */
      scale?: number;
      /** Rotation in deg */
      rotate?: number;
    }>;
  };
  /** Reusable motion preset identifier (editor convenience) */
  motionPreset?: string;
  /** Lottie animation: JSON URL */
  lottieUrl?: string;
  /** Lottie: autoplay */
  lottieAutoplay?: boolean;
  /** Lottie: loop */
  lottieLoop?: boolean;
  /** Lottie: playback speed multiplier */
  lottieSpeed?: number;
  /** Lottie: trigger behavior */
  lottieTrigger?: "load" | "hover" | "click" | "in-view" | "scroll";
  [key: string]: unknown;
}

export const baseComponentSchema = z
  .object({
    id: z.string(),
    name: z.string().optional(),
    hidden: z.boolean().optional(),
    locked: z.boolean().optional(),
    minItems: z.number().int().min(0).optional(),
    maxItems: z.number().int().min(0).optional(),
    desktopItems: z.number().int().min(0).optional(),
    tabletItems: z.number().int().min(0).optional(),
    mobileItems: z.number().int().min(0).optional(),
    clickAction: z.enum(["none", "navigate", "open-modal", "scroll-to"]).optional(),
    href: z.string().optional(),
    modalHtml: z.string().optional(),
    animation: z
      .enum([
        "none",
        "fade",
        "slide",
        "slide-up",
        "slide-down",
        "slide-left",
        "slide-right",
        "zoom",
        "rotate",
      ])
      .optional(),
    animationDuration: z.number().int().nonnegative().optional(),
    animationDelay: z.number().int().nonnegative().optional(),
    animationEasing: z.string().optional(),
    reveal: z
      .enum([
        "fade",
        "slide-up",
        "slide-down",
        "slide-left",
        "slide-right",
        "zoom",
        "rotate",
      ])
      .optional(),
    parallax: z.number().optional(),
    sticky: z.enum(["top", "bottom"]).optional(),
    stickyOffset: z.union([z.string(), z.number()]).optional(),
    hoverScale: z.number().optional(),
    hoverOpacity: z.number().optional(),
    staggerChildren: z.number().int().nonnegative().optional(),
    timeline: z
      .object({
        trigger: z.enum(["load", "click", "in-view", "scroll"]).optional(),
        loop: z.boolean().optional(),
        name: z.string().optional(),
        steps: z
          .array(
            z
              .object({
                at: z.number().min(0).max(1).optional(),
                duration: z.number().int().nonnegative().optional(),
                easing: z.string().optional(),
                opacity: z.number().min(0).max(1).optional(),
                x: z.number().optional(),
                y: z.number().optional(),
                scale: z.number().optional(),
                rotate: z.number().optional(),
              })
              .strict()
          )
          .optional(),
      })
      .strict()
      .optional(),
    motionPreset: z.string().optional(),
    lottieUrl: z.string().url().optional(),
    lottieAutoplay: z.boolean().optional(),
    lottieLoop: z.boolean().optional(),
    lottieSpeed: z.number().positive().optional(),
    lottieTrigger: z.enum(["load", "hover", "click", "in-view", "scroll"]).optional(),
  })
  .merge(layoutSchema)
  .merge(positioningSchema)
  .merge(spacingSchema)
  .passthrough();
