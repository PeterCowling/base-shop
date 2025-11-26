import type { Translator } from "./types";

type Props = {
  translator: Translator;
};

const normalizePhone = (value: string) => value.replace(/[^\d+]/g, "");

export function TypoPeopleSection({ translator }: Props) {
  const directors = [
    {
      name: translator("typo.people.cristiana.name"),
      summary: translator("typo.people.cristiana"),
      phone: translator("people.cristiana.contact.phone"),
      email: translator("people.cristiana.contact.email"),
    },
    {
      name: translator("typo.people.peter.name"),
      summary: translator("typo.people.peter"),
      phone: translator("people.peter.contact.phone"),
      email: translator("people.peter.contact.email"),
    },
  ].map((director) => ({
    ...director,
    phoneHref: normalizePhone(director.phone),
  }));

  return (
    <section className="loket-people">
      <p className="loket-people__label">{translator("typo.people.label")}</p>
      <div className="loket-people__grid">
        {directors.map((director) => (
          <article key={director.name}>
            <h3>{director.name}</h3>
            <p>{director.summary}</p>
            <div>
              <a href={`tel:${director.phoneHref}`}>{director.phone}</a>
              <a href={`mailto:${director.email}`}>{director.email}</a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
