import PageShell from "@/components/PageShell";
import PeopleCard from "@/components/PeopleCard";
import { Grid } from "@/components/primitives/Grid";
import { PEOPLE } from "@/data/people";
import { createTranslator, getMessages } from "@/lib/messages";
import { resolveLocale, type Locale } from "@/lib/locales";

type PageParams = Promise<{
  lang?: string[] | string;
}>;

export default async function PeoplePage({ params }: { params?: PageParams }) {
  const code = await params;
  const lang: Locale = resolveLocale(code?.lang);
  const messages = getMessages(lang);
  const translator = createTranslator(messages);
  const isZh = lang === "zh";

  return (
    <PageShell lang={lang} messages={messages} active="people">
      <section className="space-y-6">
        <p className="font-display text-4xl uppercase skylar-heading-tracking">
          {translator("people.heading")}
        </p>
        <p className={`font-body text-base leading-6 ${isZh ? "text-zinc-200" : "text-slate-700"}`}>
          {translator("people.companyLine")}
        </p>
      </section>
      <Grid cols={1} gap={8} className="md:grid-cols-2">
        {PEOPLE.map((person) => (
          <PeopleCard
            key={person.key}
            definition={person}
            translator={translator}
            isZh={isZh}
          />
        ))}
      </Grid>
    </PageShell>
  );
}
