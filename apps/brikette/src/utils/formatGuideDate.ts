/**
 * Format guide lastUpdated dates in a locale-aware, written-out format
 * Examples:
 * - en: "11th January 2025"
 * - de: "11. Januar 2025"
 * - fr: "11 janvier 2025"
 * - es: "11 de enero de 2025"
 */

import type { AppLanguage } from "@/i18n.config";

/**
 * Get ordinal suffix for English dates (st, nd, rd, th)
 */
function getOrdinalSuffix(day: number): string {
  if (day > 3 && day < 21) return "th"; // 11th-20th
  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

/**
 * Format date for display in guides with locale-specific written format
 * Falls back to English if no date is provided
 */
export function formatGuideDate(isoDate: string | undefined, locale: AppLanguage): string {
  if (!isoDate) {
    // No date provided - this should trigger validation warnings
    return "";
  }

  const date = new Date(isoDate);
  if (isNaN(date.getTime())) {
    // Invalid date
    return "";
  }

  const day = date.getDate();
  const month = date.toLocaleDateString(locale, { month: "long" });
  const year = date.getFullYear();

  // Locale-specific formatting
  switch (locale) {
    case "en":
      // "11th January 2025"
      return `${day}${getOrdinalSuffix(day)} ${month} ${year}`;

    case "de":
      // "11. Januar 2025"
      return `${day}. ${month} ${year}`;

    case "fr":
      // "11 janvier 2025"
      return `${day} ${month.toLowerCase()} ${year}`;

    case "es":
    case "pt":
      // "11 de enero de 2025"
      return `${day} de ${month.toLowerCase()} de ${year}`;

    case "it":
      // "11 gennaio 2025"
      return `${day} ${month.toLowerCase()} ${year}`;

    case "pl":
      // "11 stycznia 2025"
      return `${day} ${month.toLowerCase()} ${year}`;

    case "ru":
      // "11 января 2025 г."
      return `${day} ${month.toLowerCase()} ${year} г.`;

    case "ja":
      // "2025年1月11日"
      return `${year}年${date.getMonth() + 1}月${day}日`;

    case "ko":
      // "2025년 1월 11일"
      return `${year}년 ${date.getMonth() + 1}월 ${day}일`;

    case "zh":
      // "2025年1月11日"
      return `${year}年${date.getMonth() + 1}月${day}日`;

    case "ar":
      // Use Arabic locale formatting
      return date.toLocaleDateString("ar", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

    case "hi":
      // Use Hindi locale formatting
      return date.toLocaleDateString("hi", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

    default:
      // Fallback to English format
      return `${day}${getOrdinalSuffix(day)} ${date.toLocaleDateString("en", { month: "long" })} ${year}`;
  }
}

/**
 * Check if a guide has a lastUpdated date in the specified locale
 */
export function hasGuideDate(content: { lastUpdated?: string } | undefined): boolean {
  return Boolean(content?.lastUpdated);
}
