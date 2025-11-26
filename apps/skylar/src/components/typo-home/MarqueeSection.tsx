import type { Translator } from "./types";

type Props = {
  translator: Translator;
};

export function TypoMarquee({ translator }: Props) {
  const marqueePhrases = [
    translator("typo.services.strategy"),
    translator("typo.services.platforms"),
    translator("typo.services.launch"),
    translator("typo.people.cristiana.name"),
    translator("typo.people.peter.name"),
    translator("realEstate.heading"),
  ];

  return (
    <section className="loket-marquee" aria-hidden="true">
      <div className="loket-marquee__track">
        {[...marqueePhrases, ...marqueePhrases].map((phrase, index) => (
          <span key={`${phrase}-${index}`} className="loket-marquee__item">
            {phrase}
          </span>
        ))}
      </div>
    </section>
  );
}
