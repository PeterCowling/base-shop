// src/app/[lang]/private-rooms/page.tsx
// Legacy private-rooms root. Canonical entry lives at /[lang]/book-private-accommodations.
import { redirect } from "next/navigation";

import { toAppLanguage } from "@/app/_lib/i18n-server";
import { generateLangParams } from "@/app/_lib/static-params";
import { getPrivateBookingPath } from "@/utils/localizedRoutes";

import { generateMetadata as generatePrivateBookingMetadata } from "../book-private-accommodations/page";

type Props = {
  params: Promise<{ lang: string }>;
};

export async function generateStaticParams() {
  return generateLangParams();
}

export const generateMetadata = generatePrivateBookingMetadata;

export default async function PrivateRoomsPage({ params }: Props): Promise<JSX.Element> {
  const { lang } = await params;
  const validLang = toAppLanguage(lang);
  redirect(getPrivateBookingPath(validLang));
}
