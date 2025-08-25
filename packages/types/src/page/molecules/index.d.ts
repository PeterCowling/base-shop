import { z } from "zod";
import { type PageComponentBase } from "../base";
export interface AnnouncementBarComponent extends PageComponentBase {
  type: "AnnouncementBar";
  text?: string;
  link?: string;
  closable?: boolean;
}
export declare const announcementBarComponentSchema: z.ZodObject<
  {
    id: z.ZodString;
    width: z.ZodOptional<z.ZodString>;
    widthDesktop: z.ZodOptional<z.ZodString>;
    widthTablet: z.ZodOptional<z.ZodString>;
    widthMobile: z.ZodOptional<z.ZodString>;
    height: z.ZodOptional<z.ZodString>;
    heightDesktop: z.ZodOptional<z.ZodString>;
    heightTablet: z.ZodOptional<z.ZodString>;
    heightMobile: z.ZodOptional<z.ZodString>;
    position: z.ZodOptional<z.ZodEnum<["relative", "absolute"]>>;
    top: z.ZodOptional<z.ZodString>;
    left: z.ZodOptional<z.ZodString>;
    margin: z.ZodOptional<z.ZodString>;
    marginDesktop: z.ZodOptional<z.ZodString>;
    marginTablet: z.ZodOptional<z.ZodString>;
    marginMobile: z.ZodOptional<z.ZodString>;
    padding: z.ZodOptional<z.ZodString>;
    paddingDesktop: z.ZodOptional<z.ZodString>;
    paddingTablet: z.ZodOptional<z.ZodString>;
    paddingMobile: z.ZodOptional<z.ZodString>;
    minItems: z.ZodOptional<z.ZodNumber>;
    maxItems: z.ZodOptional<z.ZodNumber>;
    desktopItems: z.ZodOptional<z.ZodNumber>;
    tabletItems: z.ZodOptional<z.ZodNumber>;
    mobileItems: z.ZodOptional<z.ZodNumber>;
    clickAction: z.ZodOptional<z.ZodEnum<["none", "navigate"]>>;
    href: z.ZodOptional<z.ZodString>;
    animation: z.ZodOptional<z.ZodEnum<["none", "fade", "slide"]>>;
  } & {
    type: z.ZodLiteral<"AnnouncementBar">;
    text: z.ZodOptional<z.ZodString>;
    link: z.ZodOptional<z.ZodString>;
    closable: z.ZodOptional<z.ZodBoolean>;
  },
  "passthrough",
  z.ZodTypeAny,
  z.objectOutputType<
    {
      id: z.ZodString;
      width: z.ZodOptional<z.ZodString>;
      widthDesktop: z.ZodOptional<z.ZodString>;
      widthTablet: z.ZodOptional<z.ZodString>;
      widthMobile: z.ZodOptional<z.ZodString>;
      height: z.ZodOptional<z.ZodString>;
      heightDesktop: z.ZodOptional<z.ZodString>;
      heightTablet: z.ZodOptional<z.ZodString>;
      heightMobile: z.ZodOptional<z.ZodString>;
      position: z.ZodOptional<z.ZodEnum<["relative", "absolute"]>>;
      top: z.ZodOptional<z.ZodString>;
      left: z.ZodOptional<z.ZodString>;
      margin: z.ZodOptional<z.ZodString>;
      marginDesktop: z.ZodOptional<z.ZodString>;
      marginTablet: z.ZodOptional<z.ZodString>;
      marginMobile: z.ZodOptional<z.ZodString>;
      padding: z.ZodOptional<z.ZodString>;
      paddingDesktop: z.ZodOptional<z.ZodString>;
      paddingTablet: z.ZodOptional<z.ZodString>;
      paddingMobile: z.ZodOptional<z.ZodString>;
      minItems: z.ZodOptional<z.ZodNumber>;
      maxItems: z.ZodOptional<z.ZodNumber>;
      desktopItems: z.ZodOptional<z.ZodNumber>;
      tabletItems: z.ZodOptional<z.ZodNumber>;
      mobileItems: z.ZodOptional<z.ZodNumber>;
      clickAction: z.ZodOptional<z.ZodEnum<["none", "navigate"]>>;
      href: z.ZodOptional<z.ZodString>;
      animation: z.ZodOptional<z.ZodEnum<["none", "fade", "slide"]>>;
    } & {
      type: z.ZodLiteral<"AnnouncementBar">;
      text: z.ZodOptional<z.ZodString>;
      link: z.ZodOptional<z.ZodString>;
      closable: z.ZodOptional<z.ZodBoolean>;
    },
    z.ZodTypeAny,
    "passthrough"
  >,
  z.objectInputType<
    {
      id: z.ZodString;
      width: z.ZodOptional<z.ZodString>;
      widthDesktop: z.ZodOptional<z.ZodString>;
      widthTablet: z.ZodOptional<z.ZodString>;
      widthMobile: z.ZodOptional<z.ZodString>;
      height: z.ZodOptional<z.ZodString>;
      heightDesktop: z.ZodOptional<z.ZodString>;
      heightTablet: z.ZodOptional<z.ZodString>;
      heightMobile: z.ZodOptional<z.ZodString>;
      position: z.ZodOptional<z.ZodEnum<["relative", "absolute"]>>;
      top: z.ZodOptional<z.ZodString>;
      left: z.ZodOptional<z.ZodString>;
      margin: z.ZodOptional<z.ZodString>;
      marginDesktop: z.ZodOptional<z.ZodString>;
      marginTablet: z.ZodOptional<z.ZodString>;
      marginMobile: z.ZodOptional<z.ZodString>;
      padding: z.ZodOptional<z.ZodString>;
      paddingDesktop: z.ZodOptional<z.ZodString>;
      paddingTablet: z.ZodOptional<z.ZodString>;
      paddingMobile: z.ZodOptional<z.ZodString>;
      minItems: z.ZodOptional<z.ZodNumber>;
      maxItems: z.ZodOptional<z.ZodNumber>;
      desktopItems: z.ZodOptional<z.ZodNumber>;
      tabletItems: z.ZodOptional<z.ZodNumber>;
      mobileItems: z.ZodOptional<z.ZodNumber>;
      clickAction: z.ZodOptional<z.ZodEnum<["none", "navigate"]>>;
      href: z.ZodOptional<z.ZodString>;
      animation: z.ZodOptional<z.ZodEnum<["none", "fade", "slide"]>>;
    } & {
      type: z.ZodLiteral<"AnnouncementBar">;
      text: z.ZodOptional<z.ZodString>;
      link: z.ZodOptional<z.ZodString>;
      closable: z.ZodOptional<z.ZodBoolean>;
    },
    z.ZodTypeAny,
    "passthrough"
  >
>;
export interface ValuePropsComponent extends PageComponentBase {
  type: "ValueProps";
  items?: {
    icon: string;
    title: string;
    desc: string;
  }[];
}
export declare const valuePropsComponentSchema: z.ZodObject<
  {
    id: z.ZodString;
    width: z.ZodOptional<z.ZodString>;
    widthDesktop: z.ZodOptional<z.ZodString>;
    widthTablet: z.ZodOptional<z.ZodString>;
    widthMobile: z.ZodOptional<z.ZodString>;
    height: z.ZodOptional<z.ZodString>;
    heightDesktop: z.ZodOptional<z.ZodString>;
    heightTablet: z.ZodOptional<z.ZodString>;
    heightMobile: z.ZodOptional<z.ZodString>;
    position: z.ZodOptional<z.ZodEnum<["relative", "absolute"]>>;
    top: z.ZodOptional<z.ZodString>;
    left: z.ZodOptional<z.ZodString>;
    margin: z.ZodOptional<z.ZodString>;
    marginDesktop: z.ZodOptional<z.ZodString>;
    marginTablet: z.ZodOptional<z.ZodString>;
    marginMobile: z.ZodOptional<z.ZodString>;
    padding: z.ZodOptional<z.ZodString>;
    paddingDesktop: z.ZodOptional<z.ZodString>;
    paddingTablet: z.ZodOptional<z.ZodString>;
    paddingMobile: z.ZodOptional<z.ZodString>;
    minItems: z.ZodOptional<z.ZodNumber>;
    maxItems: z.ZodOptional<z.ZodNumber>;
    desktopItems: z.ZodOptional<z.ZodNumber>;
    tabletItems: z.ZodOptional<z.ZodNumber>;
    mobileItems: z.ZodOptional<z.ZodNumber>;
    clickAction: z.ZodOptional<z.ZodEnum<["none", "navigate"]>>;
    href: z.ZodOptional<z.ZodString>;
    animation: z.ZodOptional<z.ZodEnum<["none", "fade", "slide"]>>;
  } & {
    type: z.ZodLiteral<"ValueProps">;
    items: z.ZodOptional<
      z.ZodArray<
        z.ZodObject<
          {
            icon: z.ZodString;
            title: z.ZodString;
            desc: z.ZodString;
          },
          "strip",
          z.ZodTypeAny,
          {
            icon: string;
            title: string;
            desc: string;
          },
          {
            icon: string;
            title: string;
            desc: string;
          }
        >,
        "many"
      >
    >;
  },
  "passthrough",
  z.ZodTypeAny,
  z.objectOutputType<
    {
      id: z.ZodString;
      width: z.ZodOptional<z.ZodString>;
      widthDesktop: z.ZodOptional<z.ZodString>;
      widthTablet: z.ZodOptional<z.ZodString>;
      widthMobile: z.ZodOptional<z.ZodString>;
      height: z.ZodOptional<z.ZodString>;
      heightDesktop: z.ZodOptional<z.ZodString>;
      heightTablet: z.ZodOptional<z.ZodString>;
      heightMobile: z.ZodOptional<z.ZodString>;
      position: z.ZodOptional<z.ZodEnum<["relative", "absolute"]>>;
      top: z.ZodOptional<z.ZodString>;
      left: z.ZodOptional<z.ZodString>;
      margin: z.ZodOptional<z.ZodString>;
      marginDesktop: z.ZodOptional<z.ZodString>;
      marginTablet: z.ZodOptional<z.ZodString>;
      marginMobile: z.ZodOptional<z.ZodString>;
      padding: z.ZodOptional<z.ZodString>;
      paddingDesktop: z.ZodOptional<z.ZodString>;
      paddingTablet: z.ZodOptional<z.ZodString>;
      paddingMobile: z.ZodOptional<z.ZodString>;
      minItems: z.ZodOptional<z.ZodNumber>;
      maxItems: z.ZodOptional<z.ZodNumber>;
      desktopItems: z.ZodOptional<z.ZodNumber>;
      tabletItems: z.ZodOptional<z.ZodNumber>;
      mobileItems: z.ZodOptional<z.ZodNumber>;
      clickAction: z.ZodOptional<z.ZodEnum<["none", "navigate"]>>;
      href: z.ZodOptional<z.ZodString>;
      animation: z.ZodOptional<z.ZodEnum<["none", "fade", "slide"]>>;
    } & {
      type: z.ZodLiteral<"ValueProps">;
      items: z.ZodOptional<
        z.ZodArray<
          z.ZodObject<
            {
              icon: z.ZodString;
              title: z.ZodString;
              desc: z.ZodString;
            },
            "strip",
            z.ZodTypeAny,
            {
              icon: string;
              title: string;
              desc: string;
            },
            {
              icon: string;
              title: string;
              desc: string;
            }
          >,
          "many"
        >
      >;
    },
    z.ZodTypeAny,
    "passthrough"
  >,
  z.objectInputType<
    {
      id: z.ZodString;
      width: z.ZodOptional<z.ZodString>;
      widthDesktop: z.ZodOptional<z.ZodString>;
      widthTablet: z.ZodOptional<z.ZodString>;
      widthMobile: z.ZodOptional<z.ZodString>;
      height: z.ZodOptional<z.ZodString>;
      heightDesktop: z.ZodOptional<z.ZodString>;
      heightTablet: z.ZodOptional<z.ZodString>;
      heightMobile: z.ZodOptional<z.ZodString>;
      position: z.ZodOptional<z.ZodEnum<["relative", "absolute"]>>;
      top: z.ZodOptional<z.ZodString>;
      left: z.ZodOptional<z.ZodString>;
      margin: z.ZodOptional<z.ZodString>;
      marginDesktop: z.ZodOptional<z.ZodString>;
      marginTablet: z.ZodOptional<z.ZodString>;
      marginMobile: z.ZodOptional<z.ZodString>;
      padding: z.ZodOptional<z.ZodString>;
      paddingDesktop: z.ZodOptional<z.ZodString>;
      paddingTablet: z.ZodOptional<z.ZodString>;
      paddingMobile: z.ZodOptional<z.ZodString>;
      minItems: z.ZodOptional<z.ZodNumber>;
      maxItems: z.ZodOptional<z.ZodNumber>;
      desktopItems: z.ZodOptional<z.ZodNumber>;
      tabletItems: z.ZodOptional<z.ZodNumber>;
      mobileItems: z.ZodOptional<z.ZodNumber>;
      clickAction: z.ZodOptional<z.ZodEnum<["none", "navigate"]>>;
      href: z.ZodOptional<z.ZodString>;
      animation: z.ZodOptional<z.ZodEnum<["none", "fade", "slide"]>>;
    } & {
      type: z.ZodLiteral<"ValueProps">;
      items: z.ZodOptional<
        z.ZodArray<
          z.ZodObject<
            {
              icon: z.ZodString;
              title: z.ZodString;
              desc: z.ZodString;
            },
            "strip",
            z.ZodTypeAny,
            {
              icon: string;
              title: string;
              desc: string;
            },
            {
              icon: string;
              title: string;
              desc: string;
            }
          >,
          "many"
        >
      >;
    },
    z.ZodTypeAny,
    "passthrough"
  >
>;
export interface ReviewsCarouselComponent extends PageComponentBase {
  type: "ReviewsCarousel";
  reviews?: {
    nameKey: string;
    quoteKey: string;
  }[];
}
export declare const reviewsCarouselComponentSchema: z.ZodObject<
  {
    id: z.ZodString;
    width: z.ZodOptional<z.ZodString>;
    widthDesktop: z.ZodOptional<z.ZodString>;
    widthTablet: z.ZodOptional<z.ZodString>;
    widthMobile: z.ZodOptional<z.ZodString>;
    height: z.ZodOptional<z.ZodString>;
    heightDesktop: z.ZodOptional<z.ZodString>;
    heightTablet: z.ZodOptional<z.ZodString>;
    heightMobile: z.ZodOptional<z.ZodString>;
    position: z.ZodOptional<z.ZodEnum<["relative", "absolute"]>>;
    top: z.ZodOptional<z.ZodString>;
    left: z.ZodOptional<z.ZodString>;
    margin: z.ZodOptional<z.ZodString>;
    marginDesktop: z.ZodOptional<z.ZodString>;
    marginTablet: z.ZodOptional<z.ZodString>;
    marginMobile: z.ZodOptional<z.ZodString>;
    padding: z.ZodOptional<z.ZodString>;
    paddingDesktop: z.ZodOptional<z.ZodString>;
    paddingTablet: z.ZodOptional<z.ZodString>;
    paddingMobile: z.ZodOptional<z.ZodString>;
    minItems: z.ZodOptional<z.ZodNumber>;
    maxItems: z.ZodOptional<z.ZodNumber>;
    desktopItems: z.ZodOptional<z.ZodNumber>;
    tabletItems: z.ZodOptional<z.ZodNumber>;
    mobileItems: z.ZodOptional<z.ZodNumber>;
    clickAction: z.ZodOptional<z.ZodEnum<["none", "navigate"]>>;
    href: z.ZodOptional<z.ZodString>;
    animation: z.ZodOptional<z.ZodEnum<["none", "fade", "slide"]>>;
  } & {
    type: z.ZodLiteral<"ReviewsCarousel">;
    reviews: z.ZodOptional<
      z.ZodArray<
        z.ZodObject<
          {
            nameKey: z.ZodString;
            quoteKey: z.ZodString;
          },
          "strip",
          z.ZodTypeAny,
          {
            nameKey: string;
            quoteKey: string;
          },
          {
            nameKey: string;
            quoteKey: string;
          }
        >,
        "many"
      >
    >;
  },
  "passthrough",
  z.ZodTypeAny,
  z.objectOutputType<
    {
      id: z.ZodString;
      width: z.ZodOptional<z.ZodString>;
      widthDesktop: z.ZodOptional<z.ZodString>;
      widthTablet: z.ZodOptional<z.ZodString>;
      widthMobile: z.ZodOptional<z.ZodString>;
      height: z.ZodOptional<z.ZodString>;
      heightDesktop: z.ZodOptional<z.ZodString>;
      heightTablet: z.ZodOptional<z.ZodString>;
      heightMobile: z.ZodOptional<z.ZodString>;
      position: z.ZodOptional<z.ZodEnum<["relative", "absolute"]>>;
      top: z.ZodOptional<z.ZodString>;
      left: z.ZodOptional<z.ZodString>;
      margin: z.ZodOptional<z.ZodString>;
      marginDesktop: z.ZodOptional<z.ZodString>;
      marginTablet: z.ZodOptional<z.ZodString>;
      marginMobile: z.ZodOptional<z.ZodString>;
      padding: z.ZodOptional<z.ZodString>;
      paddingDesktop: z.ZodOptional<z.ZodString>;
      paddingTablet: z.ZodOptional<z.ZodString>;
      paddingMobile: z.ZodOptional<z.ZodString>;
      minItems: z.ZodOptional<z.ZodNumber>;
      maxItems: z.ZodOptional<z.ZodNumber>;
      desktopItems: z.ZodOptional<z.ZodNumber>;
      tabletItems: z.ZodOptional<z.ZodNumber>;
      mobileItems: z.ZodOptional<z.ZodNumber>;
      clickAction: z.ZodOptional<z.ZodEnum<["none", "navigate"]>>;
      href: z.ZodOptional<z.ZodString>;
      animation: z.ZodOptional<z.ZodEnum<["none", "fade", "slide"]>>;
    } & {
      type: z.ZodLiteral<"ReviewsCarousel">;
      reviews: z.ZodOptional<
        z.ZodArray<
          z.ZodObject<
            {
              nameKey: z.ZodString;
              quoteKey: z.ZodString;
            },
            "strip",
            z.ZodTypeAny,
            {
              nameKey: string;
              quoteKey: string;
            },
            {
              nameKey: string;
              quoteKey: string;
            }
          >,
          "many"
        >
      >;
    },
    z.ZodTypeAny,
    "passthrough"
  >,
  z.objectInputType<
    {
      id: z.ZodString;
      width: z.ZodOptional<z.ZodString>;
      widthDesktop: z.ZodOptional<z.ZodString>;
      widthTablet: z.ZodOptional<z.ZodString>;
      widthMobile: z.ZodOptional<z.ZodString>;
      height: z.ZodOptional<z.ZodString>;
      heightDesktop: z.ZodOptional<z.ZodString>;
      heightTablet: z.ZodOptional<z.ZodString>;
      heightMobile: z.ZodOptional<z.ZodString>;
      position: z.ZodOptional<z.ZodEnum<["relative", "absolute"]>>;
      top: z.ZodOptional<z.ZodString>;
      left: z.ZodOptional<z.ZodString>;
      margin: z.ZodOptional<z.ZodString>;
      marginDesktop: z.ZodOptional<z.ZodString>;
      marginTablet: z.ZodOptional<z.ZodString>;
      marginMobile: z.ZodOptional<z.ZodString>;
      padding: z.ZodOptional<z.ZodString>;
      paddingDesktop: z.ZodOptional<z.ZodString>;
      paddingTablet: z.ZodOptional<z.ZodString>;
      paddingMobile: z.ZodOptional<z.ZodString>;
      minItems: z.ZodOptional<z.ZodNumber>;
      maxItems: z.ZodOptional<z.ZodNumber>;
      desktopItems: z.ZodOptional<z.ZodNumber>;
      tabletItems: z.ZodOptional<z.ZodNumber>;
      mobileItems: z.ZodOptional<z.ZodNumber>;
      clickAction: z.ZodOptional<z.ZodEnum<["none", "navigate"]>>;
      href: z.ZodOptional<z.ZodString>;
      animation: z.ZodOptional<z.ZodEnum<["none", "fade", "slide"]>>;
    } & {
      type: z.ZodLiteral<"ReviewsCarousel">;
      reviews: z.ZodOptional<
        z.ZodArray<
          z.ZodObject<
            {
              nameKey: z.ZodString;
              quoteKey: z.ZodString;
            },
            "strip",
            z.ZodTypeAny,
            {
              nameKey: string;
              quoteKey: string;
            },
            {
              nameKey: string;
              quoteKey: string;
            }
          >,
          "many"
        >
      >;
    },
    z.ZodTypeAny,
    "passthrough"
  >
>;
export interface ContactFormComponent extends PageComponentBase {
  type: "ContactForm";
  action?: string;
  method?: string;
}
export declare const contactFormComponentSchema: z.ZodObject<
  {
    id: z.ZodString;
    width: z.ZodOptional<z.ZodString>;
    widthDesktop: z.ZodOptional<z.ZodString>;
    widthTablet: z.ZodOptional<z.ZodString>;
    widthMobile: z.ZodOptional<z.ZodString>;
    height: z.ZodOptional<z.ZodString>;
    heightDesktop: z.ZodOptional<z.ZodString>;
    heightTablet: z.ZodOptional<z.ZodString>;
    heightMobile: z.ZodOptional<z.ZodString>;
    position: z.ZodOptional<z.ZodEnum<["relative", "absolute"]>>;
    top: z.ZodOptional<z.ZodString>;
    left: z.ZodOptional<z.ZodString>;
    margin: z.ZodOptional<z.ZodString>;
    marginDesktop: z.ZodOptional<z.ZodString>;
    marginTablet: z.ZodOptional<z.ZodString>;
    marginMobile: z.ZodOptional<z.ZodString>;
    padding: z.ZodOptional<z.ZodString>;
    paddingDesktop: z.ZodOptional<z.ZodString>;
    paddingTablet: z.ZodOptional<z.ZodString>;
    paddingMobile: z.ZodOptional<z.ZodString>;
    minItems: z.ZodOptional<z.ZodNumber>;
    maxItems: z.ZodOptional<z.ZodNumber>;
    desktopItems: z.ZodOptional<z.ZodNumber>;
    tabletItems: z.ZodOptional<z.ZodNumber>;
    mobileItems: z.ZodOptional<z.ZodNumber>;
    clickAction: z.ZodOptional<z.ZodEnum<["none", "navigate"]>>;
    href: z.ZodOptional<z.ZodString>;
    animation: z.ZodOptional<z.ZodEnum<["none", "fade", "slide"]>>;
  } & {
    type: z.ZodLiteral<"ContactForm">;
    action: z.ZodOptional<z.ZodString>;
    method: z.ZodOptional<z.ZodString>;
  },
  "passthrough",
  z.ZodTypeAny,
  z.objectOutputType<
    {
      id: z.ZodString;
      width: z.ZodOptional<z.ZodString>;
      widthDesktop: z.ZodOptional<z.ZodString>;
      widthTablet: z.ZodOptional<z.ZodString>;
      widthMobile: z.ZodOptional<z.ZodString>;
      height: z.ZodOptional<z.ZodString>;
      heightDesktop: z.ZodOptional<z.ZodString>;
      heightTablet: z.ZodOptional<z.ZodString>;
      heightMobile: z.ZodOptional<z.ZodString>;
      position: z.ZodOptional<z.ZodEnum<["relative", "absolute"]>>;
      top: z.ZodOptional<z.ZodString>;
      left: z.ZodOptional<z.ZodString>;
      margin: z.ZodOptional<z.ZodString>;
      marginDesktop: z.ZodOptional<z.ZodString>;
      marginTablet: z.ZodOptional<z.ZodString>;
      marginMobile: z.ZodOptional<z.ZodString>;
      padding: z.ZodOptional<z.ZodString>;
      paddingDesktop: z.ZodOptional<z.ZodString>;
      paddingTablet: z.ZodOptional<z.ZodString>;
      paddingMobile: z.ZodOptional<z.ZodString>;
      minItems: z.ZodOptional<z.ZodNumber>;
      maxItems: z.ZodOptional<z.ZodNumber>;
      desktopItems: z.ZodOptional<z.ZodNumber>;
      tabletItems: z.ZodOptional<z.ZodNumber>;
      mobileItems: z.ZodOptional<z.ZodNumber>;
      clickAction: z.ZodOptional<z.ZodEnum<["none", "navigate"]>>;
      href: z.ZodOptional<z.ZodString>;
      animation: z.ZodOptional<z.ZodEnum<["none", "fade", "slide"]>>;
    } & {
      type: z.ZodLiteral<"ContactForm">;
      action: z.ZodOptional<z.ZodString>;
      method: z.ZodOptional<z.ZodString>;
    },
    z.ZodTypeAny,
    "passthrough"
  >,
  z.objectInputType<
    {
      id: z.ZodString;
      width: z.ZodOptional<z.ZodString>;
      widthDesktop: z.ZodOptional<z.ZodString>;
      widthTablet: z.ZodOptional<z.ZodString>;
      widthMobile: z.ZodOptional<z.ZodString>;
      height: z.ZodOptional<z.ZodString>;
      heightDesktop: z.ZodOptional<z.ZodString>;
      heightTablet: z.ZodOptional<z.ZodString>;
      heightMobile: z.ZodOptional<z.ZodString>;
      position: z.ZodOptional<z.ZodEnum<["relative", "absolute"]>>;
      top: z.ZodOptional<z.ZodString>;
      left: z.ZodOptional<z.ZodString>;
      margin: z.ZodOptional<z.ZodString>;
      marginDesktop: z.ZodOptional<z.ZodString>;
      marginTablet: z.ZodOptional<z.ZodString>;
      marginMobile: z.ZodOptional<z.ZodString>;
      padding: z.ZodOptional<z.ZodString>;
      paddingDesktop: z.ZodOptional<z.ZodString>;
      paddingTablet: z.ZodOptional<z.ZodString>;
      paddingMobile: z.ZodOptional<z.ZodString>;
      minItems: z.ZodOptional<z.ZodNumber>;
      maxItems: z.ZodOptional<z.ZodNumber>;
      desktopItems: z.ZodOptional<z.ZodNumber>;
      tabletItems: z.ZodOptional<z.ZodNumber>;
      mobileItems: z.ZodOptional<z.ZodNumber>;
      clickAction: z.ZodOptional<z.ZodEnum<["none", "navigate"]>>;
      href: z.ZodOptional<z.ZodString>;
      animation: z.ZodOptional<z.ZodEnum<["none", "fade", "slide"]>>;
    } & {
      type: z.ZodLiteral<"ContactForm">;
      action: z.ZodOptional<z.ZodString>;
      method: z.ZodOptional<z.ZodString>;
    },
    z.ZodTypeAny,
    "passthrough"
  >
>;
export interface NewsletterSignupComponent extends PageComponentBase {
  type: "NewsletterSignup";
  text?: string;
  action?: string;
  placeholder?: string;
  submitLabel?: string;
}
export declare const newsletterSignupComponentSchema: z.ZodObject<
  {
    id: z.ZodString;
    width: z.ZodOptional<z.ZodString>;
    widthDesktop: z.ZodOptional<z.ZodString>;
    widthTablet: z.ZodOptional<z.ZodString>;
    widthMobile: z.ZodOptional<z.ZodString>;
    height: z.ZodOptional<z.ZodString>;
    heightDesktop: z.ZodOptional<z.ZodString>;
    heightTablet: z.ZodOptional<z.ZodString>;
    heightMobile: z.ZodOptional<z.ZodString>;
    position: z.ZodOptional<z.ZodEnum<["relative", "absolute"]>>;
    top: z.ZodOptional<z.ZodString>;
    left: z.ZodOptional<z.ZodString>;
    margin: z.ZodOptional<z.ZodString>;
    marginDesktop: z.ZodOptional<z.ZodString>;
    marginTablet: z.ZodOptional<z.ZodString>;
    marginMobile: z.ZodOptional<z.ZodString>;
    padding: z.ZodOptional<z.ZodString>;
    paddingDesktop: z.ZodOptional<z.ZodString>;
    paddingTablet: z.ZodOptional<z.ZodString>;
    paddingMobile: z.ZodOptional<z.ZodString>;
    minItems: z.ZodOptional<z.ZodNumber>;
    maxItems: z.ZodOptional<z.ZodNumber>;
    desktopItems: z.ZodOptional<z.ZodNumber>;
    tabletItems: z.ZodOptional<z.ZodNumber>;
    mobileItems: z.ZodOptional<z.ZodNumber>;
    clickAction: z.ZodOptional<z.ZodEnum<["none", "navigate"]>>;
    href: z.ZodOptional<z.ZodString>;
    animation: z.ZodOptional<z.ZodEnum<["none", "fade", "slide"]>>;
  } & {
    type: z.ZodLiteral<"NewsletterSignup">;
    text: z.ZodOptional<z.ZodString>;
    action: z.ZodOptional<z.ZodString>;
    placeholder: z.ZodOptional<z.ZodString>;
    submitLabel: z.ZodOptional<z.ZodString>;
  },
  "passthrough",
  z.ZodTypeAny,
  z.objectOutputType<
    {
      id: z.ZodString;
      width: z.ZodOptional<z.ZodString>;
      widthDesktop: z.ZodOptional<z.ZodString>;
      widthTablet: z.ZodOptional<z.ZodString>;
      widthMobile: z.ZodOptional<z.ZodString>;
      height: z.ZodOptional<z.ZodString>;
      heightDesktop: z.ZodOptional<z.ZodString>;
      heightTablet: z.ZodOptional<z.ZodString>;
      heightMobile: z.ZodOptional<z.ZodString>;
      position: z.ZodOptional<z.ZodEnum<["relative", "absolute"]>>;
      top: z.ZodOptional<z.ZodString>;
      left: z.ZodOptional<z.ZodString>;
      margin: z.ZodOptional<z.ZodString>;
      marginDesktop: z.ZodOptional<z.ZodString>;
      marginTablet: z.ZodOptional<z.ZodString>;
      marginMobile: z.ZodOptional<z.ZodString>;
      padding: z.ZodOptional<z.ZodString>;
      paddingDesktop: z.ZodOptional<z.ZodString>;
      paddingTablet: z.ZodOptional<z.ZodString>;
      paddingMobile: z.ZodOptional<z.ZodString>;
      minItems: z.ZodOptional<z.ZodNumber>;
      maxItems: z.ZodOptional<z.ZodNumber>;
      desktopItems: z.ZodOptional<z.ZodNumber>;
      tabletItems: z.ZodOptional<z.ZodNumber>;
      mobileItems: z.ZodOptional<z.ZodNumber>;
      clickAction: z.ZodOptional<z.ZodEnum<["none", "navigate"]>>;
      href: z.ZodOptional<z.ZodString>;
      animation: z.ZodOptional<z.ZodEnum<["none", "fade", "slide"]>>;
    } & {
      type: z.ZodLiteral<"NewsletterSignup">;
      text: z.ZodOptional<z.ZodString>;
      action: z.ZodOptional<z.ZodString>;
      placeholder: z.ZodOptional<z.ZodString>;
      submitLabel: z.ZodOptional<z.ZodString>;
    },
    z.ZodTypeAny,
    "passthrough"
  >,
  z.objectInputType<
    {
      id: z.ZodString;
      width: z.ZodOptional<z.ZodString>;
      widthDesktop: z.ZodOptional<z.ZodString>;
      widthTablet: z.ZodOptional<z.ZodString>;
      widthMobile: z.ZodOptional<z.ZodString>;
      height: z.ZodOptional<z.ZodString>;
      heightDesktop: z.ZodOptional<z.ZodString>;
      heightTablet: z.ZodOptional<z.ZodString>;
      heightMobile: z.ZodOptional<z.ZodString>;
      position: z.ZodOptional<z.ZodEnum<["relative", "absolute"]>>;
      top: z.ZodOptional<z.ZodString>;
      left: z.ZodOptional<z.ZodString>;
      margin: z.ZodOptional<z.ZodString>;
      marginDesktop: z.ZodOptional<z.ZodString>;
      marginTablet: z.ZodOptional<z.ZodString>;
      marginMobile: z.ZodOptional<z.ZodString>;
      padding: z.ZodOptional<z.ZodString>;
      paddingDesktop: z.ZodOptional<z.ZodString>;
      paddingTablet: z.ZodOptional<z.ZodString>;
      paddingMobile: z.ZodOptional<z.ZodString>;
      minItems: z.ZodOptional<z.ZodNumber>;
      maxItems: z.ZodOptional<z.ZodNumber>;
      desktopItems: z.ZodOptional<z.ZodNumber>;
      tabletItems: z.ZodOptional<z.ZodNumber>;
      mobileItems: z.ZodOptional<z.ZodNumber>;
      clickAction: z.ZodOptional<z.ZodEnum<["none", "navigate"]>>;
      href: z.ZodOptional<z.ZodString>;
      animation: z.ZodOptional<z.ZodEnum<["none", "fade", "slide"]>>;
    } & {
      type: z.ZodLiteral<"NewsletterSignup">;
      text: z.ZodOptional<z.ZodString>;
      action: z.ZodOptional<z.ZodString>;
      placeholder: z.ZodOptional<z.ZodString>;
      submitLabel: z.ZodOptional<z.ZodString>;
    },
    z.ZodTypeAny,
    "passthrough"
  >
>;
export interface SearchBarComponent extends PageComponentBase {
  type: "SearchBar";
  placeholder?: string;
  limit?: number;
}
export declare const searchBarComponentSchema: z.ZodObject<
  {
    id: z.ZodString;
    width: z.ZodOptional<z.ZodString>;
    widthDesktop: z.ZodOptional<z.ZodString>;
    widthTablet: z.ZodOptional<z.ZodString>;
    widthMobile: z.ZodOptional<z.ZodString>;
    height: z.ZodOptional<z.ZodString>;
    heightDesktop: z.ZodOptional<z.ZodString>;
    heightTablet: z.ZodOptional<z.ZodString>;
    heightMobile: z.ZodOptional<z.ZodString>;
    position: z.ZodOptional<z.ZodEnum<["relative", "absolute"]>>;
    top: z.ZodOptional<z.ZodString>;
    left: z.ZodOptional<z.ZodString>;
    margin: z.ZodOptional<z.ZodString>;
    marginDesktop: z.ZodOptional<z.ZodString>;
    marginTablet: z.ZodOptional<z.ZodString>;
    marginMobile: z.ZodOptional<z.ZodString>;
    padding: z.ZodOptional<z.ZodString>;
    paddingDesktop: z.ZodOptional<z.ZodString>;
    paddingTablet: z.ZodOptional<z.ZodString>;
    paddingMobile: z.ZodOptional<z.ZodString>;
    minItems: z.ZodOptional<z.ZodNumber>;
    maxItems: z.ZodOptional<z.ZodNumber>;
    desktopItems: z.ZodOptional<z.ZodNumber>;
    tabletItems: z.ZodOptional<z.ZodNumber>;
    mobileItems: z.ZodOptional<z.ZodNumber>;
    clickAction: z.ZodOptional<z.ZodEnum<["none", "navigate"]>>;
    href: z.ZodOptional<z.ZodString>;
    animation: z.ZodOptional<z.ZodEnum<["none", "fade", "slide"]>>;
  } & {
    type: z.ZodLiteral<"SearchBar">;
    placeholder: z.ZodOptional<z.ZodString>;
    limit: z.ZodOptional<z.ZodNumber>;
  },
  "passthrough",
  z.ZodTypeAny,
  z.objectOutputType<
    {
      id: z.ZodString;
      width: z.ZodOptional<z.ZodString>;
      widthDesktop: z.ZodOptional<z.ZodString>;
      widthTablet: z.ZodOptional<z.ZodString>;
      widthMobile: z.ZodOptional<z.ZodString>;
      height: z.ZodOptional<z.ZodString>;
      heightDesktop: z.ZodOptional<z.ZodString>;
      heightTablet: z.ZodOptional<z.ZodString>;
      heightMobile: z.ZodOptional<z.ZodString>;
      position: z.ZodOptional<z.ZodEnum<["relative", "absolute"]>>;
      top: z.ZodOptional<z.ZodString>;
      left: z.ZodOptional<z.ZodString>;
      margin: z.ZodOptional<z.ZodString>;
      marginDesktop: z.ZodOptional<z.ZodString>;
      marginTablet: z.ZodOptional<z.ZodString>;
      marginMobile: z.ZodOptional<z.ZodString>;
      padding: z.ZodOptional<z.ZodString>;
      paddingDesktop: z.ZodOptional<z.ZodString>;
      paddingTablet: z.ZodOptional<z.ZodString>;
      paddingMobile: z.ZodOptional<z.ZodString>;
      minItems: z.ZodOptional<z.ZodNumber>;
      maxItems: z.ZodOptional<z.ZodNumber>;
      desktopItems: z.ZodOptional<z.ZodNumber>;
      tabletItems: z.ZodOptional<z.ZodNumber>;
      mobileItems: z.ZodOptional<z.ZodNumber>;
      clickAction: z.ZodOptional<z.ZodEnum<["none", "navigate"]>>;
      href: z.ZodOptional<z.ZodString>;
      animation: z.ZodOptional<z.ZodEnum<["none", "fade", "slide"]>>;
    } & {
      type: z.ZodLiteral<"SearchBar">;
      placeholder: z.ZodOptional<z.ZodString>;
      limit: z.ZodOptional<z.ZodNumber>;
    },
    z.ZodTypeAny,
    "passthrough"
  >,
  z.objectInputType<
    {
      id: z.ZodString;
      width: z.ZodOptional<z.ZodString>;
      widthDesktop: z.ZodOptional<z.ZodString>;
      widthTablet: z.ZodOptional<z.ZodString>;
      widthMobile: z.ZodOptional<z.ZodString>;
      height: z.ZodOptional<z.ZodString>;
      heightDesktop: z.ZodOptional<z.ZodString>;
      heightTablet: z.ZodOptional<z.ZodString>;
      heightMobile: z.ZodOptional<z.ZodString>;
      position: z.ZodOptional<z.ZodEnum<["relative", "absolute"]>>;
      top: z.ZodOptional<z.ZodString>;
      left: z.ZodOptional<z.ZodString>;
      margin: z.ZodOptional<z.ZodString>;
      marginDesktop: z.ZodOptional<z.ZodString>;
      marginTablet: z.ZodOptional<z.ZodString>;
      marginMobile: z.ZodOptional<z.ZodString>;
      padding: z.ZodOptional<z.ZodString>;
      paddingDesktop: z.ZodOptional<z.ZodString>;
      paddingTablet: z.ZodOptional<z.ZodString>;
      paddingMobile: z.ZodOptional<z.ZodString>;
      minItems: z.ZodOptional<z.ZodNumber>;
      maxItems: z.ZodOptional<z.ZodNumber>;
      desktopItems: z.ZodOptional<z.ZodNumber>;
      tabletItems: z.ZodOptional<z.ZodNumber>;
      mobileItems: z.ZodOptional<z.ZodNumber>;
      clickAction: z.ZodOptional<z.ZodEnum<["none", "navigate"]>>;
      href: z.ZodOptional<z.ZodString>;
      animation: z.ZodOptional<z.ZodEnum<["none", "fade", "slide"]>>;
    } & {
      type: z.ZodLiteral<"SearchBar">;
      placeholder: z.ZodOptional<z.ZodString>;
      limit: z.ZodOptional<z.ZodNumber>;
    },
    z.ZodTypeAny,
    "passthrough"
  >
>;
export interface MapBlockComponent extends PageComponentBase {
  type: "MapBlock";
  lat?: number;
  lng?: number;
  zoom?: number;
}
export declare const mapBlockComponentSchema: z.ZodObject<
  {
    id: z.ZodString;
    width: z.ZodOptional<z.ZodString>;
    widthDesktop: z.ZodOptional<z.ZodString>;
    widthTablet: z.ZodOptional<z.ZodString>;
    widthMobile: z.ZodOptional<z.ZodString>;
    height: z.ZodOptional<z.ZodString>;
    heightDesktop: z.ZodOptional<z.ZodString>;
    heightTablet: z.ZodOptional<z.ZodString>;
    heightMobile: z.ZodOptional<z.ZodString>;
    position: z.ZodOptional<z.ZodEnum<["relative", "absolute"]>>;
    top: z.ZodOptional<z.ZodString>;
    left: z.ZodOptional<z.ZodString>;
    margin: z.ZodOptional<z.ZodString>;
    marginDesktop: z.ZodOptional<z.ZodString>;
    marginTablet: z.ZodOptional<z.ZodString>;
    marginMobile: z.ZodOptional<z.ZodString>;
    padding: z.ZodOptional<z.ZodString>;
    paddingDesktop: z.ZodOptional<z.ZodString>;
    paddingTablet: z.ZodOptional<z.ZodString>;
    paddingMobile: z.ZodOptional<z.ZodString>;
    minItems: z.ZodOptional<z.ZodNumber>;
    maxItems: z.ZodOptional<z.ZodNumber>;
    desktopItems: z.ZodOptional<z.ZodNumber>;
    tabletItems: z.ZodOptional<z.ZodNumber>;
    mobileItems: z.ZodOptional<z.ZodNumber>;
    clickAction: z.ZodOptional<z.ZodEnum<["none", "navigate"]>>;
    href: z.ZodOptional<z.ZodString>;
    animation: z.ZodOptional<z.ZodEnum<["none", "fade", "slide"]>>;
  } & {
    type: z.ZodLiteral<"MapBlock">;
    lat: z.ZodOptional<z.ZodNumber>;
    lng: z.ZodOptional<z.ZodNumber>;
    zoom: z.ZodOptional<z.ZodNumber>;
  },
  "passthrough",
  z.ZodTypeAny,
  z.objectOutputType<
    {
      id: z.ZodString;
      width: z.ZodOptional<z.ZodString>;
      widthDesktop: z.ZodOptional<z.ZodString>;
      widthTablet: z.ZodOptional<z.ZodString>;
      widthMobile: z.ZodOptional<z.ZodString>;
      height: z.ZodOptional<z.ZodString>;
      heightDesktop: z.ZodOptional<z.ZodString>;
      heightTablet: z.ZodOptional<z.ZodString>;
      heightMobile: z.ZodOptional<z.ZodString>;
      position: z.ZodOptional<z.ZodEnum<["relative", "absolute"]>>;
      top: z.ZodOptional<z.ZodString>;
      left: z.ZodOptional<z.ZodString>;
      margin: z.ZodOptional<z.ZodString>;
      marginDesktop: z.ZodOptional<z.ZodString>;
      marginTablet: z.ZodOptional<z.ZodString>;
      marginMobile: z.ZodOptional<z.ZodString>;
      padding: z.ZodOptional<z.ZodString>;
      paddingDesktop: z.ZodOptional<z.ZodString>;
      paddingTablet: z.ZodOptional<z.ZodString>;
      paddingMobile: z.ZodOptional<z.ZodString>;
      minItems: z.ZodOptional<z.ZodNumber>;
      maxItems: z.ZodOptional<z.ZodNumber>;
      desktopItems: z.ZodOptional<z.ZodNumber>;
      tabletItems: z.ZodOptional<z.ZodNumber>;
      mobileItems: z.ZodOptional<z.ZodNumber>;
      clickAction: z.ZodOptional<z.ZodEnum<["none", "navigate"]>>;
      href: z.ZodOptional<z.ZodString>;
      animation: z.ZodOptional<z.ZodEnum<["none", "fade", "slide"]>>;
    } & {
      type: z.ZodLiteral<"MapBlock">;
      lat: z.ZodOptional<z.ZodNumber>;
      lng: z.ZodOptional<z.ZodNumber>;
      zoom: z.ZodOptional<z.ZodNumber>;
    },
    z.ZodTypeAny,
    "passthrough"
  >,
  z.objectInputType<
    {
      id: z.ZodString;
      width: z.ZodOptional<z.ZodString>;
      widthDesktop: z.ZodOptional<z.ZodString>;
      widthTablet: z.ZodOptional<z.ZodString>;
      widthMobile: z.ZodOptional<z.ZodString>;
      height: z.ZodOptional<z.ZodString>;
      heightDesktop: z.ZodOptional<z.ZodString>;
      heightTablet: z.ZodOptional<z.ZodString>;
      heightMobile: z.ZodOptional<z.ZodString>;
      position: z.ZodOptional<z.ZodEnum<["relative", "absolute"]>>;
      top: z.ZodOptional<z.ZodString>;
      left: z.ZodOptional<z.ZodString>;
      margin: z.ZodOptional<z.ZodString>;
      marginDesktop: z.ZodOptional<z.ZodString>;
      marginTablet: z.ZodOptional<z.ZodString>;
      marginMobile: z.ZodOptional<z.ZodString>;
      padding: z.ZodOptional<z.ZodString>;
      paddingDesktop: z.ZodOptional<z.ZodString>;
      paddingTablet: z.ZodOptional<z.ZodString>;
      paddingMobile: z.ZodOptional<z.ZodString>;
      minItems: z.ZodOptional<z.ZodNumber>;
      maxItems: z.ZodOptional<z.ZodNumber>;
      desktopItems: z.ZodOptional<z.ZodNumber>;
      tabletItems: z.ZodOptional<z.ZodNumber>;
      mobileItems: z.ZodOptional<z.ZodNumber>;
      clickAction: z.ZodOptional<z.ZodEnum<["none", "navigate"]>>;
      href: z.ZodOptional<z.ZodString>;
      animation: z.ZodOptional<z.ZodEnum<["none", "fade", "slide"]>>;
    } & {
      type: z.ZodLiteral<"MapBlock">;
      lat: z.ZodOptional<z.ZodNumber>;
      lng: z.ZodOptional<z.ZodNumber>;
      zoom: z.ZodOptional<z.ZodNumber>;
    },
    z.ZodTypeAny,
    "passthrough"
  >
>;
export interface VideoBlockComponent extends PageComponentBase {
  type: "VideoBlock";
  src?: string;
  autoplay?: boolean;
}
export declare const videoBlockComponentSchema: z.ZodObject<
  {
    id: z.ZodString;
    width: z.ZodOptional<z.ZodString>;
    widthDesktop: z.ZodOptional<z.ZodString>;
    widthTablet: z.ZodOptional<z.ZodString>;
    widthMobile: z.ZodOptional<z.ZodString>;
    height: z.ZodOptional<z.ZodString>;
    heightDesktop: z.ZodOptional<z.ZodString>;
    heightTablet: z.ZodOptional<z.ZodString>;
    heightMobile: z.ZodOptional<z.ZodString>;
    position: z.ZodOptional<z.ZodEnum<["relative", "absolute"]>>;
    top: z.ZodOptional<z.ZodString>;
    left: z.ZodOptional<z.ZodString>;
    margin: z.ZodOptional<z.ZodString>;
    marginDesktop: z.ZodOptional<z.ZodString>;
    marginTablet: z.ZodOptional<z.ZodString>;
    marginMobile: z.ZodOptional<z.ZodString>;
    padding: z.ZodOptional<z.ZodString>;
    paddingDesktop: z.ZodOptional<z.ZodString>;
    paddingTablet: z.ZodOptional<z.ZodString>;
    paddingMobile: z.ZodOptional<z.ZodString>;
    minItems: z.ZodOptional<z.ZodNumber>;
    maxItems: z.ZodOptional<z.ZodNumber>;
    desktopItems: z.ZodOptional<z.ZodNumber>;
    tabletItems: z.ZodOptional<z.ZodNumber>;
    mobileItems: z.ZodOptional<z.ZodNumber>;
    clickAction: z.ZodOptional<z.ZodEnum<["none", "navigate"]>>;
    href: z.ZodOptional<z.ZodString>;
    animation: z.ZodOptional<z.ZodEnum<["none", "fade", "slide"]>>;
  } & {
    type: z.ZodLiteral<"VideoBlock">;
    src: z.ZodOptional<z.ZodString>;
    autoplay: z.ZodOptional<z.ZodBoolean>;
  },
  "passthrough",
  z.ZodTypeAny,
  z.objectOutputType<
    {
      id: z.ZodString;
      width: z.ZodOptional<z.ZodString>;
      widthDesktop: z.ZodOptional<z.ZodString>;
      widthTablet: z.ZodOptional<z.ZodString>;
      widthMobile: z.ZodOptional<z.ZodString>;
      height: z.ZodOptional<z.ZodString>;
      heightDesktop: z.ZodOptional<z.ZodString>;
      heightTablet: z.ZodOptional<z.ZodString>;
      heightMobile: z.ZodOptional<z.ZodString>;
      position: z.ZodOptional<z.ZodEnum<["relative", "absolute"]>>;
      top: z.ZodOptional<z.ZodString>;
      left: z.ZodOptional<z.ZodString>;
      margin: z.ZodOptional<z.ZodString>;
      marginDesktop: z.ZodOptional<z.ZodString>;
      marginTablet: z.ZodOptional<z.ZodString>;
      marginMobile: z.ZodOptional<z.ZodString>;
      padding: z.ZodOptional<z.ZodString>;
      paddingDesktop: z.ZodOptional<z.ZodString>;
      paddingTablet: z.ZodOptional<z.ZodString>;
      paddingMobile: z.ZodOptional<z.ZodString>;
      minItems: z.ZodOptional<z.ZodNumber>;
      maxItems: z.ZodOptional<z.ZodNumber>;
      desktopItems: z.ZodOptional<z.ZodNumber>;
      tabletItems: z.ZodOptional<z.ZodNumber>;
      mobileItems: z.ZodOptional<z.ZodNumber>;
      clickAction: z.ZodOptional<z.ZodEnum<["none", "navigate"]>>;
      href: z.ZodOptional<z.ZodString>;
      animation: z.ZodOptional<z.ZodEnum<["none", "fade", "slide"]>>;
    } & {
      type: z.ZodLiteral<"VideoBlock">;
      src: z.ZodOptional<z.ZodString>;
      autoplay: z.ZodOptional<z.ZodBoolean>;
    },
    z.ZodTypeAny,
    "passthrough"
  >,
  z.objectInputType<
    {
      id: z.ZodString;
      width: z.ZodOptional<z.ZodString>;
      widthDesktop: z.ZodOptional<z.ZodString>;
      widthTablet: z.ZodOptional<z.ZodString>;
      widthMobile: z.ZodOptional<z.ZodString>;
      height: z.ZodOptional<z.ZodString>;
      heightDesktop: z.ZodOptional<z.ZodString>;
      heightTablet: z.ZodOptional<z.ZodString>;
      heightMobile: z.ZodOptional<z.ZodString>;
      position: z.ZodOptional<z.ZodEnum<["relative", "absolute"]>>;
      top: z.ZodOptional<z.ZodString>;
      left: z.ZodOptional<z.ZodString>;
      margin: z.ZodOptional<z.ZodString>;
      marginDesktop: z.ZodOptional<z.ZodString>;
      marginTablet: z.ZodOptional<z.ZodString>;
      marginMobile: z.ZodOptional<z.ZodString>;
      padding: z.ZodOptional<z.ZodString>;
      paddingDesktop: z.ZodOptional<z.ZodString>;
      paddingTablet: z.ZodOptional<z.ZodString>;
      paddingMobile: z.ZodOptional<z.ZodString>;
      minItems: z.ZodOptional<z.ZodNumber>;
      maxItems: z.ZodOptional<z.ZodNumber>;
      desktopItems: z.ZodOptional<z.ZodNumber>;
      tabletItems: z.ZodOptional<z.ZodNumber>;
      mobileItems: z.ZodOptional<z.ZodNumber>;
      clickAction: z.ZodOptional<z.ZodEnum<["none", "navigate"]>>;
      href: z.ZodOptional<z.ZodString>;
      animation: z.ZodOptional<z.ZodEnum<["none", "fade", "slide"]>>;
    } & {
      type: z.ZodLiteral<"VideoBlock">;
      src: z.ZodOptional<z.ZodString>;
      autoplay: z.ZodOptional<z.ZodBoolean>;
    },
    z.ZodTypeAny,
    "passthrough"
  >
>;
export interface FAQBlockComponent extends PageComponentBase {
  type: "FAQBlock";
  items?: {
    question: string;
    answer: string;
  }[];
}
export declare const faqBlockComponentSchema: z.ZodObject<
  {
    id: z.ZodString;
    width: z.ZodOptional<z.ZodString>;
    widthDesktop: z.ZodOptional<z.ZodString>;
    widthTablet: z.ZodOptional<z.ZodString>;
    widthMobile: z.ZodOptional<z.ZodString>;
    height: z.ZodOptional<z.ZodString>;
    heightDesktop: z.ZodOptional<z.ZodString>;
    heightTablet: z.ZodOptional<z.ZodString>;
    heightMobile: z.ZodOptional<z.ZodString>;
    position: z.ZodOptional<z.ZodEnum<["relative", "absolute"]>>;
    top: z.ZodOptional<z.ZodString>;
    left: z.ZodOptional<z.ZodString>;
    margin: z.ZodOptional<z.ZodString>;
    marginDesktop: z.ZodOptional<z.ZodString>;
    marginTablet: z.ZodOptional<z.ZodString>;
    marginMobile: z.ZodOptional<z.ZodString>;
    padding: z.ZodOptional<z.ZodString>;
    paddingDesktop: z.ZodOptional<z.ZodString>;
    paddingTablet: z.ZodOptional<z.ZodString>;
    paddingMobile: z.ZodOptional<z.ZodString>;
    minItems: z.ZodOptional<z.ZodNumber>;
    maxItems: z.ZodOptional<z.ZodNumber>;
    desktopItems: z.ZodOptional<z.ZodNumber>;
    tabletItems: z.ZodOptional<z.ZodNumber>;
    mobileItems: z.ZodOptional<z.ZodNumber>;
    clickAction: z.ZodOptional<z.ZodEnum<["none", "navigate"]>>;
    href: z.ZodOptional<z.ZodString>;
    animation: z.ZodOptional<z.ZodEnum<["none", "fade", "slide"]>>;
  } & {
    type: z.ZodLiteral<"FAQBlock">;
    items: z.ZodOptional<
      z.ZodArray<
        z.ZodObject<
          {
            question: z.ZodString;
            answer: z.ZodString;
          },
          "strip",
          z.ZodTypeAny,
          {
            question: string;
            answer: string;
          },
          {
            question: string;
            answer: string;
          }
        >,
        "many"
      >
    >;
  },
  "passthrough",
  z.ZodTypeAny,
  z.objectOutputType<
    {
      id: z.ZodString;
      width: z.ZodOptional<z.ZodString>;
      widthDesktop: z.ZodOptional<z.ZodString>;
      widthTablet: z.ZodOptional<z.ZodString>;
      widthMobile: z.ZodOptional<z.ZodString>;
      height: z.ZodOptional<z.ZodString>;
      heightDesktop: z.ZodOptional<z.ZodString>;
      heightTablet: z.ZodOptional<z.ZodString>;
      heightMobile: z.ZodOptional<z.ZodString>;
      position: z.ZodOptional<z.ZodEnum<["relative", "absolute"]>>;
      top: z.ZodOptional<z.ZodString>;
      left: z.ZodOptional<z.ZodString>;
      margin: z.ZodOptional<z.ZodString>;
      marginDesktop: z.ZodOptional<z.ZodString>;
      marginTablet: z.ZodOptional<z.ZodString>;
      marginMobile: z.ZodOptional<z.ZodString>;
      padding: z.ZodOptional<z.ZodString>;
      paddingDesktop: z.ZodOptional<z.ZodString>;
      paddingTablet: z.ZodOptional<z.ZodString>;
      paddingMobile: z.ZodOptional<z.ZodString>;
      minItems: z.ZodOptional<z.ZodNumber>;
      maxItems: z.ZodOptional<z.ZodNumber>;
      desktopItems: z.ZodOptional<z.ZodNumber>;
      tabletItems: z.ZodOptional<z.ZodNumber>;
      mobileItems: z.ZodOptional<z.ZodNumber>;
      clickAction: z.ZodOptional<z.ZodEnum<["none", "navigate"]>>;
      href: z.ZodOptional<z.ZodString>;
      animation: z.ZodOptional<z.ZodEnum<["none", "fade", "slide"]>>;
    } & {
      type: z.ZodLiteral<"FAQBlock">;
      items: z.ZodOptional<
        z.ZodArray<
          z.ZodObject<
            {
              question: z.ZodString;
              answer: z.ZodString;
            },
            "strip",
            z.ZodTypeAny,
            {
              question: string;
              answer: string;
            },
            {
              question: string;
              answer: string;
            }
          >,
          "many"
        >
      >;
    },
    z.ZodTypeAny,
    "passthrough"
  >,
  z.objectInputType<
    {
      id: z.ZodString;
      width: z.ZodOptional<z.ZodString>;
      widthDesktop: z.ZodOptional<z.ZodString>;
      widthTablet: z.ZodOptional<z.ZodString>;
      widthMobile: z.ZodOptional<z.ZodString>;
      height: z.ZodOptional<z.ZodString>;
      heightDesktop: z.ZodOptional<z.ZodString>;
      heightTablet: z.ZodOptional<z.ZodString>;
      heightMobile: z.ZodOptional<z.ZodString>;
      position: z.ZodOptional<z.ZodEnum<["relative", "absolute"]>>;
      top: z.ZodOptional<z.ZodString>;
      left: z.ZodOptional<z.ZodString>;
      margin: z.ZodOptional<z.ZodString>;
      marginDesktop: z.ZodOptional<z.ZodString>;
      marginTablet: z.ZodOptional<z.ZodString>;
      marginMobile: z.ZodOptional<z.ZodString>;
      padding: z.ZodOptional<z.ZodString>;
      paddingDesktop: z.ZodOptional<z.ZodString>;
      paddingTablet: z.ZodOptional<z.ZodString>;
      paddingMobile: z.ZodOptional<z.ZodString>;
      minItems: z.ZodOptional<z.ZodNumber>;
      maxItems: z.ZodOptional<z.ZodNumber>;
      desktopItems: z.ZodOptional<z.ZodNumber>;
      tabletItems: z.ZodOptional<z.ZodNumber>;
      mobileItems: z.ZodOptional<z.ZodNumber>;
      clickAction: z.ZodOptional<z.ZodEnum<["none", "navigate"]>>;
      href: z.ZodOptional<z.ZodString>;
      animation: z.ZodOptional<z.ZodEnum<["none", "fade", "slide"]>>;
    } & {
      type: z.ZodLiteral<"FAQBlock">;
      items: z.ZodOptional<
        z.ZodArray<
          z.ZodObject<
            {
              question: z.ZodString;
              answer: z.ZodString;
            },
            "strip",
            z.ZodTypeAny,
            {
              question: string;
              answer: string;
            },
            {
              question: string;
              answer: string;
            }
          >,
          "many"
        >
      >;
    },
    z.ZodTypeAny,
    "passthrough"
  >
>;
export interface CountdownTimerComponent extends PageComponentBase {
  type: "CountdownTimer";
  targetDate?: string;
  timezone?: string;
  completionText?: string;
  styles?: string;
}
export declare const countdownTimerComponentSchema: z.ZodObject<
  {
    id: z.ZodString;
    width: z.ZodOptional<z.ZodString>;
    widthDesktop: z.ZodOptional<z.ZodString>;
    widthTablet: z.ZodOptional<z.ZodString>;
    widthMobile: z.ZodOptional<z.ZodString>;
    height: z.ZodOptional<z.ZodString>;
    heightDesktop: z.ZodOptional<z.ZodString>;
    heightTablet: z.ZodOptional<z.ZodString>;
    heightMobile: z.ZodOptional<z.ZodString>;
    position: z.ZodOptional<z.ZodEnum<["relative", "absolute"]>>;
    top: z.ZodOptional<z.ZodString>;
    left: z.ZodOptional<z.ZodString>;
    margin: z.ZodOptional<z.ZodString>;
    marginDesktop: z.ZodOptional<z.ZodString>;
    marginTablet: z.ZodOptional<z.ZodString>;
    marginMobile: z.ZodOptional<z.ZodString>;
    padding: z.ZodOptional<z.ZodString>;
    paddingDesktop: z.ZodOptional<z.ZodString>;
    paddingTablet: z.ZodOptional<z.ZodString>;
    paddingMobile: z.ZodOptional<z.ZodString>;
    minItems: z.ZodOptional<z.ZodNumber>;
    maxItems: z.ZodOptional<z.ZodNumber>;
    desktopItems: z.ZodOptional<z.ZodNumber>;
    tabletItems: z.ZodOptional<z.ZodNumber>;
    mobileItems: z.ZodOptional<z.ZodNumber>;
    clickAction: z.ZodOptional<z.ZodEnum<["none", "navigate"]>>;
    href: z.ZodOptional<z.ZodString>;
    animation: z.ZodOptional<z.ZodEnum<["none", "fade", "slide"]>>;
  } & {
    type: z.ZodLiteral<"CountdownTimer">;
    targetDate: z.ZodOptional<z.ZodString>;
    timezone: z.ZodOptional<z.ZodString>;
    completionText: z.ZodOptional<z.ZodString>;
    styles: z.ZodOptional<z.ZodString>;
  },
  "passthrough",
  z.ZodTypeAny,
  z.objectOutputType<
    {
      id: z.ZodString;
      width: z.ZodOptional<z.ZodString>;
      widthDesktop: z.ZodOptional<z.ZodString>;
      widthTablet: z.ZodOptional<z.ZodString>;
      widthMobile: z.ZodOptional<z.ZodString>;
      height: z.ZodOptional<z.ZodString>;
      heightDesktop: z.ZodOptional<z.ZodString>;
      heightTablet: z.ZodOptional<z.ZodString>;
      heightMobile: z.ZodOptional<z.ZodString>;
      position: z.ZodOptional<z.ZodEnum<["relative", "absolute"]>>;
      top: z.ZodOptional<z.ZodString>;
      left: z.ZodOptional<z.ZodString>;
      margin: z.ZodOptional<z.ZodString>;
      marginDesktop: z.ZodOptional<z.ZodString>;
      marginTablet: z.ZodOptional<z.ZodString>;
      marginMobile: z.ZodOptional<z.ZodString>;
      padding: z.ZodOptional<z.ZodString>;
      paddingDesktop: z.ZodOptional<z.ZodString>;
      paddingTablet: z.ZodOptional<z.ZodString>;
      paddingMobile: z.ZodOptional<z.ZodString>;
      minItems: z.ZodOptional<z.ZodNumber>;
      maxItems: z.ZodOptional<z.ZodNumber>;
      desktopItems: z.ZodOptional<z.ZodNumber>;
      tabletItems: z.ZodOptional<z.ZodNumber>;
      mobileItems: z.ZodOptional<z.ZodNumber>;
      clickAction: z.ZodOptional<z.ZodEnum<["none", "navigate"]>>;
      href: z.ZodOptional<z.ZodString>;
      animation: z.ZodOptional<z.ZodEnum<["none", "fade", "slide"]>>;
    } & {
      type: z.ZodLiteral<"CountdownTimer">;
      targetDate: z.ZodOptional<z.ZodString>;
      timezone: z.ZodOptional<z.ZodString>;
      completionText: z.ZodOptional<z.ZodString>;
      styles: z.ZodOptional<z.ZodString>;
    },
    z.ZodTypeAny,
    "passthrough"
  >,
  z.objectInputType<
    {
      id: z.ZodString;
      width: z.ZodOptional<z.ZodString>;
      widthDesktop: z.ZodOptional<z.ZodString>;
      widthTablet: z.ZodOptional<z.ZodString>;
      widthMobile: z.ZodOptional<z.ZodString>;
      height: z.ZodOptional<z.ZodString>;
      heightDesktop: z.ZodOptional<z.ZodString>;
      heightTablet: z.ZodOptional<z.ZodString>;
      heightMobile: z.ZodOptional<z.ZodString>;
      position: z.ZodOptional<z.ZodEnum<["relative", "absolute"]>>;
      top: z.ZodOptional<z.ZodString>;
      left: z.ZodOptional<z.ZodString>;
      margin: z.ZodOptional<z.ZodString>;
      marginDesktop: z.ZodOptional<z.ZodString>;
      marginTablet: z.ZodOptional<z.ZodString>;
      marginMobile: z.ZodOptional<z.ZodString>;
      padding: z.ZodOptional<z.ZodString>;
      paddingDesktop: z.ZodOptional<z.ZodString>;
      paddingTablet: z.ZodOptional<z.ZodString>;
      paddingMobile: z.ZodOptional<z.ZodString>;
      minItems: z.ZodOptional<z.ZodNumber>;
      maxItems: z.ZodOptional<z.ZodNumber>;
      desktopItems: z.ZodOptional<z.ZodNumber>;
      tabletItems: z.ZodOptional<z.ZodNumber>;
      mobileItems: z.ZodOptional<z.ZodNumber>;
      clickAction: z.ZodOptional<z.ZodEnum<["none", "navigate"]>>;
      href: z.ZodOptional<z.ZodString>;
      animation: z.ZodOptional<z.ZodEnum<["none", "fade", "slide"]>>;
    } & {
      type: z.ZodLiteral<"CountdownTimer">;
      targetDate: z.ZodOptional<z.ZodString>;
      timezone: z.ZodOptional<z.ZodString>;
      completionText: z.ZodOptional<z.ZodString>;
      styles: z.ZodOptional<z.ZodString>;
    },
    z.ZodTypeAny,
    "passthrough"
  >
>;
export interface SocialLinksComponent extends PageComponentBase {
  type: "SocialLinks";
  facebook?: string;
  instagram?: string;
  x?: string;
  youtube?: string;
  linkedin?: string;
}
export declare const socialLinksComponentSchema: z.ZodObject<
  {
    id: z.ZodString;
    width: z.ZodOptional<z.ZodString>;
    widthDesktop: z.ZodOptional<z.ZodString>;
    widthTablet: z.ZodOptional<z.ZodString>;
    widthMobile: z.ZodOptional<z.ZodString>;
    height: z.ZodOptional<z.ZodString>;
    heightDesktop: z.ZodOptional<z.ZodString>;
    heightTablet: z.ZodOptional<z.ZodString>;
    heightMobile: z.ZodOptional<z.ZodString>;
    position: z.ZodOptional<z.ZodEnum<["relative", "absolute"]>>;
    top: z.ZodOptional<z.ZodString>;
    left: z.ZodOptional<z.ZodString>;
    margin: z.ZodOptional<z.ZodString>;
    marginDesktop: z.ZodOptional<z.ZodString>;
    marginTablet: z.ZodOptional<z.ZodString>;
    marginMobile: z.ZodOptional<z.ZodString>;
    padding: z.ZodOptional<z.ZodString>;
    paddingDesktop: z.ZodOptional<z.ZodString>;
    paddingTablet: z.ZodOptional<z.ZodString>;
    paddingMobile: z.ZodOptional<z.ZodString>;
    minItems: z.ZodOptional<z.ZodNumber>;
    maxItems: z.ZodOptional<z.ZodNumber>;
    desktopItems: z.ZodOptional<z.ZodNumber>;
    tabletItems: z.ZodOptional<z.ZodNumber>;
    mobileItems: z.ZodOptional<z.ZodNumber>;
    clickAction: z.ZodOptional<z.ZodEnum<["none", "navigate"]>>;
    href: z.ZodOptional<z.ZodString>;
    animation: z.ZodOptional<z.ZodEnum<["none", "fade", "slide"]>>;
  } & {
    type: z.ZodLiteral<"SocialLinks">;
    facebook: z.ZodOptional<z.ZodString>;
    instagram: z.ZodOptional<z.ZodString>;
    x: z.ZodOptional<z.ZodString>;
    youtube: z.ZodOptional<z.ZodString>;
    linkedin: z.ZodOptional<z.ZodString>;
  },
  "passthrough",
  z.ZodTypeAny,
  z.objectOutputType<
    {
      id: z.ZodString;
      width: z.ZodOptional<z.ZodString>;
      widthDesktop: z.ZodOptional<z.ZodString>;
      widthTablet: z.ZodOptional<z.ZodString>;
      widthMobile: z.ZodOptional<z.ZodString>;
      height: z.ZodOptional<z.ZodString>;
      heightDesktop: z.ZodOptional<z.ZodString>;
      heightTablet: z.ZodOptional<z.ZodString>;
      heightMobile: z.ZodOptional<z.ZodString>;
      position: z.ZodOptional<z.ZodEnum<["relative", "absolute"]>>;
      top: z.ZodOptional<z.ZodString>;
      left: z.ZodOptional<z.ZodString>;
      margin: z.ZodOptional<z.ZodString>;
      marginDesktop: z.ZodOptional<z.ZodString>;
      marginTablet: z.ZodOptional<z.ZodString>;
      marginMobile: z.ZodOptional<z.ZodString>;
      padding: z.ZodOptional<z.ZodString>;
      paddingDesktop: z.ZodOptional<z.ZodString>;
      paddingTablet: z.ZodOptional<z.ZodString>;
      paddingMobile: z.ZodOptional<z.ZodString>;
      minItems: z.ZodOptional<z.ZodNumber>;
      maxItems: z.ZodOptional<z.ZodNumber>;
      desktopItems: z.ZodOptional<z.ZodNumber>;
      tabletItems: z.ZodOptional<z.ZodNumber>;
      mobileItems: z.ZodOptional<z.ZodNumber>;
      clickAction: z.ZodOptional<z.ZodEnum<["none", "navigate"]>>;
      href: z.ZodOptional<z.ZodString>;
      animation: z.ZodOptional<z.ZodEnum<["none", "fade", "slide"]>>;
    } & {
      type: z.ZodLiteral<"SocialLinks">;
      facebook: z.ZodOptional<z.ZodString>;
      instagram: z.ZodOptional<z.ZodString>;
      x: z.ZodOptional<z.ZodString>;
      youtube: z.ZodOptional<z.ZodString>;
      linkedin: z.ZodOptional<z.ZodString>;
    },
    z.ZodTypeAny,
    "passthrough"
  >,
  z.objectInputType<
    {
      id: z.ZodString;
      width: z.ZodOptional<z.ZodString>;
      widthDesktop: z.ZodOptional<z.ZodString>;
      widthTablet: z.ZodOptional<z.ZodString>;
      widthMobile: z.ZodOptional<z.ZodString>;
      height: z.ZodOptional<z.ZodString>;
      heightDesktop: z.ZodOptional<z.ZodString>;
      heightTablet: z.ZodOptional<z.ZodString>;
      heightMobile: z.ZodOptional<z.ZodString>;
      position: z.ZodOptional<z.ZodEnum<["relative", "absolute"]>>;
      top: z.ZodOptional<z.ZodString>;
      left: z.ZodOptional<z.ZodString>;
      margin: z.ZodOptional<z.ZodString>;
      marginDesktop: z.ZodOptional<z.ZodString>;
      marginTablet: z.ZodOptional<z.ZodString>;
      marginMobile: z.ZodOptional<z.ZodString>;
      padding: z.ZodOptional<z.ZodString>;
      paddingDesktop: z.ZodOptional<z.ZodString>;
      paddingTablet: z.ZodOptional<z.ZodString>;
      paddingMobile: z.ZodOptional<z.ZodString>;
      minItems: z.ZodOptional<z.ZodNumber>;
      maxItems: z.ZodOptional<z.ZodNumber>;
      desktopItems: z.ZodOptional<z.ZodNumber>;
      tabletItems: z.ZodOptional<z.ZodNumber>;
      mobileItems: z.ZodOptional<z.ZodNumber>;
      clickAction: z.ZodOptional<z.ZodEnum<["none", "navigate"]>>;
      href: z.ZodOptional<z.ZodString>;
      animation: z.ZodOptional<z.ZodEnum<["none", "fade", "slide"]>>;
    } & {
      type: z.ZodLiteral<"SocialLinks">;
      facebook: z.ZodOptional<z.ZodString>;
      instagram: z.ZodOptional<z.ZodString>;
      x: z.ZodOptional<z.ZodString>;
      youtube: z.ZodOptional<z.ZodString>;
      linkedin: z.ZodOptional<z.ZodString>;
    },
    z.ZodTypeAny,
    "passthrough"
  >
>;
export interface SocialFeedComponent extends PageComponentBase {
  type: "SocialFeed";
  platform?: "twitter" | "instagram";
  account?: string;
  hashtag?: string;
}
export declare const socialFeedComponentSchema: z.ZodObject<
  {
    id: z.ZodString;
    width: z.ZodOptional<z.ZodString>;
    widthDesktop: z.ZodOptional<z.ZodString>;
    widthTablet: z.ZodOptional<z.ZodString>;
    widthMobile: z.ZodOptional<z.ZodString>;
    height: z.ZodOptional<z.ZodString>;
    heightDesktop: z.ZodOptional<z.ZodString>;
    heightTablet: z.ZodOptional<z.ZodString>;
    heightMobile: z.ZodOptional<z.ZodString>;
    position: z.ZodOptional<z.ZodEnum<["relative", "absolute"]>>;
    top: z.ZodOptional<z.ZodString>;
    left: z.ZodOptional<z.ZodString>;
    margin: z.ZodOptional<z.ZodString>;
    marginDesktop: z.ZodOptional<z.ZodString>;
    marginTablet: z.ZodOptional<z.ZodString>;
    marginMobile: z.ZodOptional<z.ZodString>;
    padding: z.ZodOptional<z.ZodString>;
    paddingDesktop: z.ZodOptional<z.ZodString>;
    paddingTablet: z.ZodOptional<z.ZodString>;
    paddingMobile: z.ZodOptional<z.ZodString>;
    minItems: z.ZodOptional<z.ZodNumber>;
    maxItems: z.ZodOptional<z.ZodNumber>;
    desktopItems: z.ZodOptional<z.ZodNumber>;
    tabletItems: z.ZodOptional<z.ZodNumber>;
    mobileItems: z.ZodOptional<z.ZodNumber>;
    clickAction: z.ZodOptional<z.ZodEnum<["none", "navigate"]>>;
    href: z.ZodOptional<z.ZodString>;
    animation: z.ZodOptional<z.ZodEnum<["none", "fade", "slide"]>>;
  } & {
    type: z.ZodLiteral<"SocialFeed">;
    platform: z.ZodOptional<z.ZodEnum<["twitter", "instagram"]>>;
    account: z.ZodOptional<z.ZodString>;
    hashtag: z.ZodOptional<z.ZodString>;
  },
  "passthrough",
  z.ZodTypeAny,
  z.objectOutputType<
    {
      id: z.ZodString;
      width: z.ZodOptional<z.ZodString>;
      widthDesktop: z.ZodOptional<z.ZodString>;
      widthTablet: z.ZodOptional<z.ZodString>;
      widthMobile: z.ZodOptional<z.ZodString>;
      height: z.ZodOptional<z.ZodString>;
      heightDesktop: z.ZodOptional<z.ZodString>;
      heightTablet: z.ZodOptional<z.ZodString>;
      heightMobile: z.ZodOptional<z.ZodString>;
      position: z.ZodOptional<z.ZodEnum<["relative", "absolute"]>>;
      top: z.ZodOptional<z.ZodString>;
      left: z.ZodOptional<z.ZodString>;
      margin: z.ZodOptional<z.ZodString>;
      marginDesktop: z.ZodOptional<z.ZodString>;
      marginTablet: z.ZodOptional<z.ZodString>;
      marginMobile: z.ZodOptional<z.ZodString>;
      padding: z.ZodOptional<z.ZodString>;
      paddingDesktop: z.ZodOptional<z.ZodString>;
      paddingTablet: z.ZodOptional<z.ZodString>;
      paddingMobile: z.ZodOptional<z.ZodString>;
      minItems: z.ZodOptional<z.ZodNumber>;
      maxItems: z.ZodOptional<z.ZodNumber>;
      desktopItems: z.ZodOptional<z.ZodNumber>;
      tabletItems: z.ZodOptional<z.ZodNumber>;
      mobileItems: z.ZodOptional<z.ZodNumber>;
      clickAction: z.ZodOptional<z.ZodEnum<["none", "navigate"]>>;
      href: z.ZodOptional<z.ZodString>;
      animation: z.ZodOptional<z.ZodEnum<["none", "fade", "slide"]>>;
    } & {
      type: z.ZodLiteral<"SocialFeed">;
      platform: z.ZodOptional<z.ZodEnum<["twitter", "instagram"]>>;
      account: z.ZodOptional<z.ZodString>;
      hashtag: z.ZodOptional<z.ZodString>;
    },
    z.ZodTypeAny,
    "passthrough"
  >,
  z.objectInputType<
    {
      id: z.ZodString;
      width: z.ZodOptional<z.ZodString>;
      widthDesktop: z.ZodOptional<z.ZodString>;
      widthTablet: z.ZodOptional<z.ZodString>;
      widthMobile: z.ZodOptional<z.ZodString>;
      height: z.ZodOptional<z.ZodString>;
      heightDesktop: z.ZodOptional<z.ZodString>;
      heightTablet: z.ZodOptional<z.ZodString>;
      heightMobile: z.ZodOptional<z.ZodString>;
      position: z.ZodOptional<z.ZodEnum<["relative", "absolute"]>>;
      top: z.ZodOptional<z.ZodString>;
      left: z.ZodOptional<z.ZodString>;
      margin: z.ZodOptional<z.ZodString>;
      marginDesktop: z.ZodOptional<z.ZodString>;
      marginTablet: z.ZodOptional<z.ZodString>;
      marginMobile: z.ZodOptional<z.ZodString>;
      padding: z.ZodOptional<z.ZodString>;
      paddingDesktop: z.ZodOptional<z.ZodString>;
      paddingTablet: z.ZodOptional<z.ZodString>;
      paddingMobile: z.ZodOptional<z.ZodString>;
      minItems: z.ZodOptional<z.ZodNumber>;
      maxItems: z.ZodOptional<z.ZodNumber>;
      desktopItems: z.ZodOptional<z.ZodNumber>;
      tabletItems: z.ZodOptional<z.ZodNumber>;
      mobileItems: z.ZodOptional<z.ZodNumber>;
      clickAction: z.ZodOptional<z.ZodEnum<["none", "navigate"]>>;
      href: z.ZodOptional<z.ZodString>;
      animation: z.ZodOptional<z.ZodEnum<["none", "fade", "slide"]>>;
    } & {
      type: z.ZodLiteral<"SocialFeed">;
      platform: z.ZodOptional<z.ZodEnum<["twitter", "instagram"]>>;
      account: z.ZodOptional<z.ZodString>;
      hashtag: z.ZodOptional<z.ZodString>;
    },
    z.ZodTypeAny,
    "passthrough"
  >
>;
export interface SocialProofComponent extends PageComponentBase {
  type: "SocialProof";
  source?: string;
  frequency?: number;
}
export declare const socialProofComponentSchema: z.ZodObject<
  {
    id: z.ZodString;
    width: z.ZodOptional<z.ZodString>;
    widthDesktop: z.ZodOptional<z.ZodString>;
    widthTablet: z.ZodOptional<z.ZodString>;
    widthMobile: z.ZodOptional<z.ZodString>;
    height: z.ZodOptional<z.ZodString>;
    heightDesktop: z.ZodOptional<z.ZodString>;
    heightTablet: z.ZodOptional<z.ZodString>;
    heightMobile: z.ZodOptional<z.ZodString>;
    position: z.ZodOptional<z.ZodEnum<["relative", "absolute"]>>;
    top: z.ZodOptional<z.ZodString>;
    left: z.ZodOptional<z.ZodString>;
    margin: z.ZodOptional<z.ZodString>;
    marginDesktop: z.ZodOptional<z.ZodString>;
    marginTablet: z.ZodOptional<z.ZodString>;
    marginMobile: z.ZodOptional<z.ZodString>;
    padding: z.ZodOptional<z.ZodString>;
    paddingDesktop: z.ZodOptional<z.ZodString>;
    paddingTablet: z.ZodOptional<z.ZodString>;
    paddingMobile: z.ZodOptional<z.ZodString>;
    minItems: z.ZodOptional<z.ZodNumber>;
    maxItems: z.ZodOptional<z.ZodNumber>;
    desktopItems: z.ZodOptional<z.ZodNumber>;
    tabletItems: z.ZodOptional<z.ZodNumber>;
    mobileItems: z.ZodOptional<z.ZodNumber>;
    clickAction: z.ZodOptional<z.ZodEnum<["none", "navigate"]>>;
    href: z.ZodOptional<z.ZodString>;
    animation: z.ZodOptional<z.ZodEnum<["none", "fade", "slide"]>>;
  } & {
    type: z.ZodLiteral<"SocialProof">;
    source: z.ZodOptional<z.ZodString>;
    frequency: z.ZodOptional<z.ZodNumber>;
  },
  "passthrough",
  z.ZodTypeAny,
  z.objectOutputType<
    {
      id: z.ZodString;
      width: z.ZodOptional<z.ZodString>;
      widthDesktop: z.ZodOptional<z.ZodString>;
      widthTablet: z.ZodOptional<z.ZodString>;
      widthMobile: z.ZodOptional<z.ZodString>;
      height: z.ZodOptional<z.ZodString>;
      heightDesktop: z.ZodOptional<z.ZodString>;
      heightTablet: z.ZodOptional<z.ZodString>;
      heightMobile: z.ZodOptional<z.ZodString>;
      position: z.ZodOptional<z.ZodEnum<["relative", "absolute"]>>;
      top: z.ZodOptional<z.ZodString>;
      left: z.ZodOptional<z.ZodString>;
      margin: z.ZodOptional<z.ZodString>;
      marginDesktop: z.ZodOptional<z.ZodString>;
      marginTablet: z.ZodOptional<z.ZodString>;
      marginMobile: z.ZodOptional<z.ZodString>;
      padding: z.ZodOptional<z.ZodString>;
      paddingDesktop: z.ZodOptional<z.ZodString>;
      paddingTablet: z.ZodOptional<z.ZodString>;
      paddingMobile: z.ZodOptional<z.ZodString>;
      minItems: z.ZodOptional<z.ZodNumber>;
      maxItems: z.ZodOptional<z.ZodNumber>;
      desktopItems: z.ZodOptional<z.ZodNumber>;
      tabletItems: z.ZodOptional<z.ZodNumber>;
      mobileItems: z.ZodOptional<z.ZodNumber>;
      clickAction: z.ZodOptional<z.ZodEnum<["none", "navigate"]>>;
      href: z.ZodOptional<z.ZodString>;
      animation: z.ZodOptional<z.ZodEnum<["none", "fade", "slide"]>>;
    } & {
      type: z.ZodLiteral<"SocialProof">;
      source: z.ZodOptional<z.ZodString>;
      frequency: z.ZodOptional<z.ZodNumber>;
    },
    z.ZodTypeAny,
    "passthrough"
  >,
  z.objectInputType<
    {
      id: z.ZodString;
      width: z.ZodOptional<z.ZodString>;
      widthDesktop: z.ZodOptional<z.ZodString>;
      widthTablet: z.ZodOptional<z.ZodString>;
      widthMobile: z.ZodOptional<z.ZodString>;
      height: z.ZodOptional<z.ZodString>;
      heightDesktop: z.ZodOptional<z.ZodString>;
      heightTablet: z.ZodOptional<z.ZodString>;
      heightMobile: z.ZodOptional<z.ZodString>;
      position: z.ZodOptional<z.ZodEnum<["relative", "absolute"]>>;
      top: z.ZodOptional<z.ZodString>;
      left: z.ZodOptional<z.ZodString>;
      margin: z.ZodOptional<z.ZodString>;
      marginDesktop: z.ZodOptional<z.ZodString>;
      marginTablet: z.ZodOptional<z.ZodString>;
      marginMobile: z.ZodOptional<z.ZodString>;
      padding: z.ZodOptional<z.ZodString>;
      paddingDesktop: z.ZodOptional<z.ZodString>;
      paddingTablet: z.ZodOptional<z.ZodString>;
      paddingMobile: z.ZodOptional<z.ZodString>;
      minItems: z.ZodOptional<z.ZodNumber>;
      maxItems: z.ZodOptional<z.ZodNumber>;
      desktopItems: z.ZodOptional<z.ZodNumber>;
      tabletItems: z.ZodOptional<z.ZodNumber>;
      mobileItems: z.ZodOptional<z.ZodNumber>;
      clickAction: z.ZodOptional<z.ZodEnum<["none", "navigate"]>>;
      href: z.ZodOptional<z.ZodString>;
      animation: z.ZodOptional<z.ZodEnum<["none", "fade", "slide"]>>;
    } & {
      type: z.ZodLiteral<"SocialProof">;
      source: z.ZodOptional<z.ZodString>;
      frequency: z.ZodOptional<z.ZodNumber>;
    },
    z.ZodTypeAny,
    "passthrough"
  >
>;
