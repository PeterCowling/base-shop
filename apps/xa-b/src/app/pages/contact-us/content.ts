/* eslint-disable -- XA-0001 [ttl=2026-12-31] contact content uses legacy wording/palette pending design/i18n overhaul */
export const customerServiceSidebarLinks = [
  { label: "Contact us", href: "/pages/contact-us" },
  { label: "How to shop", href: "/pages/how-to-shop" },
  { label: "Orders and delivery", href: "/service-center" },
  { label: "Payment and pricing", href: "/pages/payment-and-pricing" },
  { label: "Cryptocurrency payments", href: "/pages/cryptocurrency-payment" },
  { label: "Returns and refunds", href: "/pages/return-policy" },
  { label: "FAQs", href: "/faqs" },
  { label: "Terms and conditions", href: "/pages/terms-of-service" },
  { label: "Privacy policy", href: "/pages/privacy-policy" },
] as const;

export const quickActions = [
  { label: "Check the status of my order", href: "/account/trackingorder" },
  { label: "Cancel my order", href: "/account/orders" },
  { label: "Return my order", href: "/account/orders" },
  { label: "Check my return status", href: "/account/orders" },
] as const;

export const cancelSteps = [
  "Open Orders & Returns in your account, or use guest order lookup with your order number and email address.",
  "Select the items you want to cancel and share a reason for the cancellation.",
  "Look out for a confirmation email once your cancellation is processed.",
] as const;

export const returnSteps = [
  "Open Orders & Returns in your account, or use guest order lookup with your order number and email address.",
  "Find the order and choose Return Item(s).",
  "Select each item and choose a reason for the return.",
  "Choose a return method: book a collection or drop off at a courier point.",
] as const;

export const buildPrepareSteps = (packagingItems: string) =>
  [
    `Pack the item securely, including any branded ${packagingItems}.`,
    "Attach the return label to the outside of the parcel.",
    "If a return note was included, attach it to the outside of the parcel as well.",
  ] as const;

export const contactPreferences = [
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "whatsapp", label: "WhatsApp" },
] as const;

export const queryTypes = [
  "Order update",
  "Returns & refunds",
  "Payment & pricing",
  "Account support",
  "Product question",
  "Other",
] as const;

export const countries = ["United States", "Canada", "United Kingdom", "Australia", "Singapore"] as const;
