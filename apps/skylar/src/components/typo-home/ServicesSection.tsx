import type { Translator } from "./types";

type Props = {
  translator: Translator;
};

export function TypoServicesSection({ translator }: Props) {
  const servicesList = [
    translator("services.list.design"),
    translator("services.list.distribution"),
    translator("services.list.platform"),
  ];

  return (
    <section className="loket-services">
      <p className="loket-services__label">{translator("typo.services.label")}</p>
      <ul>
        {servicesList.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
