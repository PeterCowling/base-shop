import PageShell from "@/components/PageShell";
import PeopleCard from "@/components/PeopleCard";
import { Grid } from "@/components/primitives/Grid";
import { PEOPLE } from "@/data/people";
import { createTranslator, getMessages } from "@/lib/messages";
import { LOCALES, getLocaleFromParams, type LangRouteParams, type Locale } from "@/lib/locales";
import { joinClasses } from "@/lib/joinClasses";

export default async function PeoplePage({ params }: { params?: Promise<LangRouteParams> }) {
  const resolvedParams = params ? await params : undefined;
  const lang: Locale = getLocaleFromParams(resolvedParams);
  const messages = getMessages(lang);
  const translator = createTranslator(messages);
  const isEn = lang === "en";
  const isZh = lang === "zh";
  const isIt = lang === "it";
  if (isEn) {
    const hero = {
      eyebrow: translator("people.en.hero.eyebrow"),
      title: translator("people.en.hero.title"),
      body: translator("people.en.hero.body"),
    };

    return (
      <PageShell lang={lang} active="people">
        <section className="people-en-hero">
          <p className="people-en-hero__eyebrow">{hero.eyebrow}</p>
          <h1 className="people-en-hero__title">{hero.title}</h1>
          <p className="people-en-hero__body">{hero.body}</p>
        </section>
        <section className="people-en-grid">
          {PEOPLE.map((person) => (
            <PeopleCard key={person.key} definition={person} lang={lang} />
          ))}
        </section>
      </PageShell>
    );
  }

  const heroWrapperClass = isZh ? ["zh-card", "zh-people-hero"].join(" ") : isIt ? "milan-people-hero" : "space-y-6";
  const heroHeadingClass = isZh
    ? "zh-people-hero__eyebrow"
    : isIt
      ? "milan-people-hero__title"
      : ["font-display", "text-4xl", "uppercase", "skylar-heading-tracking"].join(" ");
  const heroBodyClass = isZh
    ? "zh-people-hero__body"
    : isIt
      ? "milan-people-hero__body"
      : ["font-body", "text-base", "leading-6", "text-muted-foreground"].join(" ");

  return (
    <PageShell lang={lang} active="people">
      <section className={heroWrapperClass}>
        {isIt ? (
          <>
            <p className="milan-eyebrow">{translator("people.companyLine")}</p>
            <p className={heroHeadingClass}>{translator("people.it.hero.title")}</p>
            <p className={heroBodyClass}>{translator("people.it.hero.body")}</p>
          </>
        ) : (
          <>
            <p className={heroHeadingClass}>{translator("people.heading")}</p>
            <p className={heroBodyClass}>{translator("people.companyLine")}</p>
          </>
        )}
      </section>
      {isZh ? (
        <div className="zh-people-grid">
          {PEOPLE.map((person) => (
            <PeopleCard key={person.key} definition={person} lang={lang} />
          ))}
        </div>
      ) : (
        <Grid
          cols={1}
          gap={8}
          className={joinClasses("md:grid-cols-2", isIt && "milan-people-grid")}
        >
          {PEOPLE.map((person) => (
            <PeopleCard key={person.key} definition={person} lang={lang} />
          ))}
        </Grid>
      )}
    </PageShell>
  );
}

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}
