export function toWhatsappHref(phoneNumber: string) {
  const digits = phoneNumber.replace(/\D/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}`;
}

export function toWhatsappTextHref(phoneNumber: string, text: string) {
  const base = toWhatsappHref(phoneNumber);
  if (!base) return null;
  return `${base}?text=${encodeURIComponent(text)}`;
}

