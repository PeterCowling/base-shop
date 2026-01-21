import { z } from "zod";

import { type PageComponentBase } from "../base";
import type { PageComponent } from "../page";

export interface TabsAccordionContainerComponent extends PageComponentBase {
    type: "TabsAccordionContainer";
    children?: PageComponent[];
    mode?: "tabs" | "accordion";
    tabs?: string[];
}
export declare const tabsAccordionContainerComponentSchema: z.ZodObject<{
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
} & {
    type: z.ZodLiteral<"TabsAccordionContainer">;
    children: z.ZodDefault<z.ZodArray<z.ZodLazy<z.ZodTypeAny>, "many">>;
    mode: z.ZodOptional<z.ZodEnum<["tabs", "accordion"]>>;
    tabs: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
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
} & {
    type: z.ZodLiteral<"TabsAccordionContainer">;
    children: z.ZodDefault<z.ZodArray<z.ZodLazy<z.ZodTypeAny>, "many">>;
    mode: z.ZodOptional<z.ZodEnum<["tabs", "accordion"]>>;
    tabs: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
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
} & {
    type: z.ZodLiteral<"TabsAccordionContainer">;
    children: z.ZodDefault<z.ZodArray<z.ZodLazy<z.ZodTypeAny>, "many">>;
    mode: z.ZodOptional<z.ZodEnum<["tabs", "accordion"]>>;
    tabs: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, z.ZodTypeAny, "passthrough">>;
//# sourceMappingURL=tabs-accordion-container.d.ts.map