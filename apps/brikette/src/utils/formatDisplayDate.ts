export default function formatDisplayDate(lang: string, date: Date): string {
  return new Intl.DateTimeFormat(lang, { dateStyle: "medium" }).format(date);
}
