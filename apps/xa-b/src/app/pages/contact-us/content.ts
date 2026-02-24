import { xaI18n } from "../../../lib/xaI18n";

export const customerServiceSidebarLinks = [
  { label: "Contact us", href: "/pages/contact-us" },
  { label: "How to shop", href: "/pages/how-to-shop" },
  { label: xaI18n.t("xaB.src.app.pages.contact.us.content.l4c12"), href: "/service-center" },
  { label: xaI18n.t("xaB.src.app.pages.contact.us.content.l5c12"), href: "/pages/payment-and-pricing" },
  { label: xaI18n.t("xaB.src.app.pages.contact.us.content.l6c12"), href: "/pages/cryptocurrency-payment" },
  { label: xaI18n.t("xaB.src.app.pages.contact.us.content.l7c12"), href: "/pages/return-policy" },
  { label: "FAQs", href: "/faqs" },
  { label: xaI18n.t("xaB.src.app.pages.contact.us.content.l9c12"), href: "/pages/terms-of-service" },
  { label: xaI18n.t("xaB.src.app.pages.contact.us.content.l10c12"), href: "/pages/privacy-policy" },
] as const;

export const quickActions = [
  { label: xaI18n.t("xaB.src.app.pages.contact.us.content.l14c12"), href: "/account/trackingorder" },
  { label: xaI18n.t("xaB.src.app.pages.contact.us.content.l15c12"), href: "/account/orders" },
  { label: xaI18n.t("xaB.src.app.pages.contact.us.content.l16c12"), href: "/account/orders" },
  { label: xaI18n.t("xaB.src.app.pages.contact.us.content.l17c12"), href: "/account/orders" },
] as const;

export const cancelSteps = [
  xaI18n.t("xaB.src.app.pages.contact.us.content.l21c3"),
  "Select the items you want to cancel and share a reason for the cancellation.",
  "Look out for a confirmation email once your cancellation is processed.",
] as const;

export const returnSteps = [
  xaI18n.t("xaB.src.app.pages.contact.us.content.l27c3"),
  "Find the order and choose Return Item(s).",
  "Select each item and choose a reason for the return.",
  xaI18n.t("xaB.src.app.pages.contact.us.content.l30c3"),
] as const;

export const buildPrepareSteps = (packagingItems: string) =>
  [
    `Pack the item securely, including any branded ${packagingItems}.`,
    "Attach the return label to the outside of the parcel.",
    xaI18n.t("xaB.src.app.pages.contact.us.content.l37c5"),
  ] as const;

export const contactPreferences = [
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "whatsapp", label: "WhatsApp" },
] as const;

export const queryTypes = [
  "Order update",
  xaI18n.t("xaB.src.app.pages.contact.us.content.l48c3"),
  xaI18n.t("xaB.src.app.pages.contact.us.content.l49c3"),
  xaI18n.t("xaB.src.app.pages.contact.us.content.l50c3"),
  xaI18n.t("xaB.src.app.pages.contact.us.content.l51c3"),
  "Other",
] as const;

export const countries = [xaI18n.t("xaB.src.app.pages.contact.us.content.l55c27"), "Canada", xaI18n.t("xaB.src.app.pages.contact.us.content.l55c54"), "Australia", "Singapore"] as const;
