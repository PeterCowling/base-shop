import { z } from "zod";

import type { Translated } from "../Product";

import type { LayoutProps } from "./layout";
import type { PositioningProps } from "./positioning";
import type { SpacingProps } from "./spacing";

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
    animation?: "none" | "fade" | "slide" | "slide-up" | "slide-down" | "slide-left" | "slide-right" | "zoom" | "rotate";
    /** Animation duration in milliseconds */
    animationDuration?: number;
    /** Animation delay in milliseconds */
    animationDelay?: number;
    /** CSS easing function (e.g. 'ease', 'linear', 'cubic-bezier(...)') */
    animationEasing?: string;
    /** Reveal effect on scroll */
    reveal?: "fade" | "slide-up" | "slide-down" | "slide-left" | "slide-right" | "zoom" | "rotate";
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
export declare const baseComponentSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    hidden: z.ZodOptional<z.ZodBoolean>;
    locked: z.ZodOptional<z.ZodBoolean>;
    minItems: z.ZodOptional<z.ZodNumber>;
    maxItems: z.ZodOptional<z.ZodNumber>;
    desktopItems: z.ZodOptional<z.ZodNumber>;
    tabletItems: z.ZodOptional<z.ZodNumber>;
    mobileItems: z.ZodOptional<z.ZodNumber>;
    clickAction: z.ZodOptional<z.ZodEnum<["none", "navigate", "open-modal", "scroll-to"]>>;
    href: z.ZodOptional<z.ZodString>;
    modalHtml: z.ZodOptional<z.ZodString>;
    animation: z.ZodOptional<z.ZodEnum<["none", "fade", "slide", "slide-up", "slide-down", "slide-left", "slide-right", "zoom", "rotate"]>>;
    animationDuration: z.ZodOptional<z.ZodNumber>;
    animationDelay: z.ZodOptional<z.ZodNumber>;
    animationEasing: z.ZodOptional<z.ZodString>;
    reveal: z.ZodOptional<z.ZodEnum<["fade", "slide-up", "slide-down", "slide-left", "slide-right", "zoom", "rotate"]>>;
    parallax: z.ZodOptional<z.ZodNumber>;
    sticky: z.ZodOptional<z.ZodEnum<["top", "bottom"]>>;
    stickyOffset: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    hoverScale: z.ZodOptional<z.ZodNumber>;
    hoverOpacity: z.ZodOptional<z.ZodNumber>;
    staggerChildren: z.ZodOptional<z.ZodNumber>;
    timeline: z.ZodOptional<z.ZodObject<{
        trigger: z.ZodOptional<z.ZodEnum<["load", "click", "in-view", "scroll"]>>;
        loop: z.ZodOptional<z.ZodBoolean>;
        name: z.ZodOptional<z.ZodString>;
        steps: z.ZodOptional<z.ZodArray<z.ZodObject<{
            at: z.ZodOptional<z.ZodNumber>;
            duration: z.ZodOptional<z.ZodNumber>;
            easing: z.ZodOptional<z.ZodString>;
            opacity: z.ZodOptional<z.ZodNumber>;
            x: z.ZodOptional<z.ZodNumber>;
            y: z.ZodOptional<z.ZodNumber>;
            scale: z.ZodOptional<z.ZodNumber>;
            rotate: z.ZodOptional<z.ZodNumber>;
        }, "strict", z.ZodTypeAny, {
            at?: number | undefined;
            duration?: number | undefined;
            rotate?: number | undefined;
            easing?: string | undefined;
            opacity?: number | undefined;
            x?: number | undefined;
            y?: number | undefined;
            scale?: number | undefined;
        }, {
            at?: number | undefined;
            duration?: number | undefined;
            rotate?: number | undefined;
            easing?: string | undefined;
            opacity?: number | undefined;
            x?: number | undefined;
            y?: number | undefined;
            scale?: number | undefined;
        }>, "many">>;
    }, "strict", z.ZodTypeAny, {
        name?: string | undefined;
        trigger?: "load" | "click" | "in-view" | "scroll" | undefined;
        loop?: boolean | undefined;
        steps?: {
            at?: number | undefined;
            duration?: number | undefined;
            rotate?: number | undefined;
            easing?: string | undefined;
            opacity?: number | undefined;
            x?: number | undefined;
            y?: number | undefined;
            scale?: number | undefined;
        }[] | undefined;
    }, {
        name?: string | undefined;
        trigger?: "load" | "click" | "in-view" | "scroll" | undefined;
        loop?: boolean | undefined;
        steps?: {
            at?: number | undefined;
            duration?: number | undefined;
            rotate?: number | undefined;
            easing?: string | undefined;
            opacity?: number | undefined;
            x?: number | undefined;
            y?: number | undefined;
            scale?: number | undefined;
        }[] | undefined;
    }>>;
    motionPreset: z.ZodOptional<z.ZodString>;
    lottieUrl: z.ZodOptional<z.ZodString>;
    lottieAutoplay: z.ZodOptional<z.ZodBoolean>;
    lottieLoop: z.ZodOptional<z.ZodBoolean>;
    lottieSpeed: z.ZodOptional<z.ZodNumber>;
    lottieTrigger: z.ZodOptional<z.ZodEnum<["load", "hover", "click", "in-view", "scroll"]>>;
} & {
    width: z.ZodOptional<z.ZodString>;
    widthDesktop: z.ZodOptional<z.ZodString>;
    widthTablet: z.ZodOptional<z.ZodString>;
    widthMobile: z.ZodOptional<z.ZodString>;
    height: z.ZodOptional<z.ZodString>;
    heightDesktop: z.ZodOptional<z.ZodString>;
    heightTablet: z.ZodOptional<z.ZodString>;
    heightMobile: z.ZodOptional<z.ZodString>;
} & {
    position: z.ZodOptional<z.ZodEnum<["relative", "absolute"]>>;
    zIndex: z.ZodOptional<z.ZodNumber>;
    top: z.ZodOptional<z.ZodString>;
    topDesktop: z.ZodOptional<z.ZodString>;
    topTablet: z.ZodOptional<z.ZodString>;
    topMobile: z.ZodOptional<z.ZodString>;
    left: z.ZodOptional<z.ZodString>;
    leftDesktop: z.ZodOptional<z.ZodString>;
    leftTablet: z.ZodOptional<z.ZodString>;
    leftMobile: z.ZodOptional<z.ZodString>;
    right: z.ZodOptional<z.ZodString>;
    bottom: z.ZodOptional<z.ZodString>;
    dockX: z.ZodOptional<z.ZodEnum<["left", "right", "center"]>>;
    dockY: z.ZodOptional<z.ZodEnum<["top", "bottom", "center"]>>;
} & {
    margin: z.ZodOptional<z.ZodString>;
    marginDesktop: z.ZodOptional<z.ZodString>;
    marginTablet: z.ZodOptional<z.ZodString>;
    marginMobile: z.ZodOptional<z.ZodString>;
    padding: z.ZodOptional<z.ZodString>;
    paddingDesktop: z.ZodOptional<z.ZodString>;
    paddingTablet: z.ZodOptional<z.ZodString>;
    paddingMobile: z.ZodOptional<z.ZodString>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    id: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    hidden: z.ZodOptional<z.ZodBoolean>;
    locked: z.ZodOptional<z.ZodBoolean>;
    minItems: z.ZodOptional<z.ZodNumber>;
    maxItems: z.ZodOptional<z.ZodNumber>;
    desktopItems: z.ZodOptional<z.ZodNumber>;
    tabletItems: z.ZodOptional<z.ZodNumber>;
    mobileItems: z.ZodOptional<z.ZodNumber>;
    clickAction: z.ZodOptional<z.ZodEnum<["none", "navigate", "open-modal", "scroll-to"]>>;
    href: z.ZodOptional<z.ZodString>;
    modalHtml: z.ZodOptional<z.ZodString>;
    animation: z.ZodOptional<z.ZodEnum<["none", "fade", "slide", "slide-up", "slide-down", "slide-left", "slide-right", "zoom", "rotate"]>>;
    animationDuration: z.ZodOptional<z.ZodNumber>;
    animationDelay: z.ZodOptional<z.ZodNumber>;
    animationEasing: z.ZodOptional<z.ZodString>;
    reveal: z.ZodOptional<z.ZodEnum<["fade", "slide-up", "slide-down", "slide-left", "slide-right", "zoom", "rotate"]>>;
    parallax: z.ZodOptional<z.ZodNumber>;
    sticky: z.ZodOptional<z.ZodEnum<["top", "bottom"]>>;
    stickyOffset: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    hoverScale: z.ZodOptional<z.ZodNumber>;
    hoverOpacity: z.ZodOptional<z.ZodNumber>;
    staggerChildren: z.ZodOptional<z.ZodNumber>;
    timeline: z.ZodOptional<z.ZodObject<{
        trigger: z.ZodOptional<z.ZodEnum<["load", "click", "in-view", "scroll"]>>;
        loop: z.ZodOptional<z.ZodBoolean>;
        name: z.ZodOptional<z.ZodString>;
        steps: z.ZodOptional<z.ZodArray<z.ZodObject<{
            at: z.ZodOptional<z.ZodNumber>;
            duration: z.ZodOptional<z.ZodNumber>;
            easing: z.ZodOptional<z.ZodString>;
            opacity: z.ZodOptional<z.ZodNumber>;
            x: z.ZodOptional<z.ZodNumber>;
            y: z.ZodOptional<z.ZodNumber>;
            scale: z.ZodOptional<z.ZodNumber>;
            rotate: z.ZodOptional<z.ZodNumber>;
        }, "strict", z.ZodTypeAny, {
            at?: number | undefined;
            duration?: number | undefined;
            rotate?: number | undefined;
            easing?: string | undefined;
            opacity?: number | undefined;
            x?: number | undefined;
            y?: number | undefined;
            scale?: number | undefined;
        }, {
            at?: number | undefined;
            duration?: number | undefined;
            rotate?: number | undefined;
            easing?: string | undefined;
            opacity?: number | undefined;
            x?: number | undefined;
            y?: number | undefined;
            scale?: number | undefined;
        }>, "many">>;
    }, "strict", z.ZodTypeAny, {
        name?: string | undefined;
        trigger?: "load" | "click" | "in-view" | "scroll" | undefined;
        loop?: boolean | undefined;
        steps?: {
            at?: number | undefined;
            duration?: number | undefined;
            rotate?: number | undefined;
            easing?: string | undefined;
            opacity?: number | undefined;
            x?: number | undefined;
            y?: number | undefined;
            scale?: number | undefined;
        }[] | undefined;
    }, {
        name?: string | undefined;
        trigger?: "load" | "click" | "in-view" | "scroll" | undefined;
        loop?: boolean | undefined;
        steps?: {
            at?: number | undefined;
            duration?: number | undefined;
            rotate?: number | undefined;
            easing?: string | undefined;
            opacity?: number | undefined;
            x?: number | undefined;
            y?: number | undefined;
            scale?: number | undefined;
        }[] | undefined;
    }>>;
    motionPreset: z.ZodOptional<z.ZodString>;
    lottieUrl: z.ZodOptional<z.ZodString>;
    lottieAutoplay: z.ZodOptional<z.ZodBoolean>;
    lottieLoop: z.ZodOptional<z.ZodBoolean>;
    lottieSpeed: z.ZodOptional<z.ZodNumber>;
    lottieTrigger: z.ZodOptional<z.ZodEnum<["load", "hover", "click", "in-view", "scroll"]>>;
} & {
    width: z.ZodOptional<z.ZodString>;
    widthDesktop: z.ZodOptional<z.ZodString>;
    widthTablet: z.ZodOptional<z.ZodString>;
    widthMobile: z.ZodOptional<z.ZodString>;
    height: z.ZodOptional<z.ZodString>;
    heightDesktop: z.ZodOptional<z.ZodString>;
    heightTablet: z.ZodOptional<z.ZodString>;
    heightMobile: z.ZodOptional<z.ZodString>;
} & {
    position: z.ZodOptional<z.ZodEnum<["relative", "absolute"]>>;
    zIndex: z.ZodOptional<z.ZodNumber>;
    top: z.ZodOptional<z.ZodString>;
    topDesktop: z.ZodOptional<z.ZodString>;
    topTablet: z.ZodOptional<z.ZodString>;
    topMobile: z.ZodOptional<z.ZodString>;
    left: z.ZodOptional<z.ZodString>;
    leftDesktop: z.ZodOptional<z.ZodString>;
    leftTablet: z.ZodOptional<z.ZodString>;
    leftMobile: z.ZodOptional<z.ZodString>;
    right: z.ZodOptional<z.ZodString>;
    bottom: z.ZodOptional<z.ZodString>;
    dockX: z.ZodOptional<z.ZodEnum<["left", "right", "center"]>>;
    dockY: z.ZodOptional<z.ZodEnum<["top", "bottom", "center"]>>;
} & {
    margin: z.ZodOptional<z.ZodString>;
    marginDesktop: z.ZodOptional<z.ZodString>;
    marginTablet: z.ZodOptional<z.ZodString>;
    marginMobile: z.ZodOptional<z.ZodString>;
    padding: z.ZodOptional<z.ZodString>;
    paddingDesktop: z.ZodOptional<z.ZodString>;
    paddingTablet: z.ZodOptional<z.ZodString>;
    paddingMobile: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    id: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    hidden: z.ZodOptional<z.ZodBoolean>;
    locked: z.ZodOptional<z.ZodBoolean>;
    minItems: z.ZodOptional<z.ZodNumber>;
    maxItems: z.ZodOptional<z.ZodNumber>;
    desktopItems: z.ZodOptional<z.ZodNumber>;
    tabletItems: z.ZodOptional<z.ZodNumber>;
    mobileItems: z.ZodOptional<z.ZodNumber>;
    clickAction: z.ZodOptional<z.ZodEnum<["none", "navigate", "open-modal", "scroll-to"]>>;
    href: z.ZodOptional<z.ZodString>;
    modalHtml: z.ZodOptional<z.ZodString>;
    animation: z.ZodOptional<z.ZodEnum<["none", "fade", "slide", "slide-up", "slide-down", "slide-left", "slide-right", "zoom", "rotate"]>>;
    animationDuration: z.ZodOptional<z.ZodNumber>;
    animationDelay: z.ZodOptional<z.ZodNumber>;
    animationEasing: z.ZodOptional<z.ZodString>;
    reveal: z.ZodOptional<z.ZodEnum<["fade", "slide-up", "slide-down", "slide-left", "slide-right", "zoom", "rotate"]>>;
    parallax: z.ZodOptional<z.ZodNumber>;
    sticky: z.ZodOptional<z.ZodEnum<["top", "bottom"]>>;
    stickyOffset: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    hoverScale: z.ZodOptional<z.ZodNumber>;
    hoverOpacity: z.ZodOptional<z.ZodNumber>;
    staggerChildren: z.ZodOptional<z.ZodNumber>;
    timeline: z.ZodOptional<z.ZodObject<{
        trigger: z.ZodOptional<z.ZodEnum<["load", "click", "in-view", "scroll"]>>;
        loop: z.ZodOptional<z.ZodBoolean>;
        name: z.ZodOptional<z.ZodString>;
        steps: z.ZodOptional<z.ZodArray<z.ZodObject<{
            at: z.ZodOptional<z.ZodNumber>;
            duration: z.ZodOptional<z.ZodNumber>;
            easing: z.ZodOptional<z.ZodString>;
            opacity: z.ZodOptional<z.ZodNumber>;
            x: z.ZodOptional<z.ZodNumber>;
            y: z.ZodOptional<z.ZodNumber>;
            scale: z.ZodOptional<z.ZodNumber>;
            rotate: z.ZodOptional<z.ZodNumber>;
        }, "strict", z.ZodTypeAny, {
            at?: number | undefined;
            duration?: number | undefined;
            rotate?: number | undefined;
            easing?: string | undefined;
            opacity?: number | undefined;
            x?: number | undefined;
            y?: number | undefined;
            scale?: number | undefined;
        }, {
            at?: number | undefined;
            duration?: number | undefined;
            rotate?: number | undefined;
            easing?: string | undefined;
            opacity?: number | undefined;
            x?: number | undefined;
            y?: number | undefined;
            scale?: number | undefined;
        }>, "many">>;
    }, "strict", z.ZodTypeAny, {
        name?: string | undefined;
        trigger?: "load" | "click" | "in-view" | "scroll" | undefined;
        loop?: boolean | undefined;
        steps?: {
            at?: number | undefined;
            duration?: number | undefined;
            rotate?: number | undefined;
            easing?: string | undefined;
            opacity?: number | undefined;
            x?: number | undefined;
            y?: number | undefined;
            scale?: number | undefined;
        }[] | undefined;
    }, {
        name?: string | undefined;
        trigger?: "load" | "click" | "in-view" | "scroll" | undefined;
        loop?: boolean | undefined;
        steps?: {
            at?: number | undefined;
            duration?: number | undefined;
            rotate?: number | undefined;
            easing?: string | undefined;
            opacity?: number | undefined;
            x?: number | undefined;
            y?: number | undefined;
            scale?: number | undefined;
        }[] | undefined;
    }>>;
    motionPreset: z.ZodOptional<z.ZodString>;
    lottieUrl: z.ZodOptional<z.ZodString>;
    lottieAutoplay: z.ZodOptional<z.ZodBoolean>;
    lottieLoop: z.ZodOptional<z.ZodBoolean>;
    lottieSpeed: z.ZodOptional<z.ZodNumber>;
    lottieTrigger: z.ZodOptional<z.ZodEnum<["load", "hover", "click", "in-view", "scroll"]>>;
} & {
    width: z.ZodOptional<z.ZodString>;
    widthDesktop: z.ZodOptional<z.ZodString>;
    widthTablet: z.ZodOptional<z.ZodString>;
    widthMobile: z.ZodOptional<z.ZodString>;
    height: z.ZodOptional<z.ZodString>;
    heightDesktop: z.ZodOptional<z.ZodString>;
    heightTablet: z.ZodOptional<z.ZodString>;
    heightMobile: z.ZodOptional<z.ZodString>;
} & {
    position: z.ZodOptional<z.ZodEnum<["relative", "absolute"]>>;
    zIndex: z.ZodOptional<z.ZodNumber>;
    top: z.ZodOptional<z.ZodString>;
    topDesktop: z.ZodOptional<z.ZodString>;
    topTablet: z.ZodOptional<z.ZodString>;
    topMobile: z.ZodOptional<z.ZodString>;
    left: z.ZodOptional<z.ZodString>;
    leftDesktop: z.ZodOptional<z.ZodString>;
    leftTablet: z.ZodOptional<z.ZodString>;
    leftMobile: z.ZodOptional<z.ZodString>;
    right: z.ZodOptional<z.ZodString>;
    bottom: z.ZodOptional<z.ZodString>;
    dockX: z.ZodOptional<z.ZodEnum<["left", "right", "center"]>>;
    dockY: z.ZodOptional<z.ZodEnum<["top", "bottom", "center"]>>;
} & {
    margin: z.ZodOptional<z.ZodString>;
    marginDesktop: z.ZodOptional<z.ZodString>;
    marginTablet: z.ZodOptional<z.ZodString>;
    marginMobile: z.ZodOptional<z.ZodString>;
    padding: z.ZodOptional<z.ZodString>;
    paddingDesktop: z.ZodOptional<z.ZodString>;
    paddingTablet: z.ZodOptional<z.ZodString>;
    paddingMobile: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">>;
//# sourceMappingURL=base.d.ts.map