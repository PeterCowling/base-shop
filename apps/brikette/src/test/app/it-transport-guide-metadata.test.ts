import { readFileSync } from "node:fs";
import path from "node:path";

type Case = {
  contentKey: string;
  description: string;
  title: string;
};

const IT_TRANSPORT_CASES: Case[] = [
  {
    contentKey: "amalfiPositanoBus",
    title: "Amalfi Positano in bus (SITA 5070): orari e fermate | Hostel Brikette",
    description:
      "Orari 2026, prezzo (€2,60), dove salire ad Amalfi e dove scendere a Chiesa Nuova per arrivare a Hostel Brikette in 2-5 minuti.",
  },
  {
    contentKey: "amalfiPositanoFerry",
    title: "Traghetto Amalfi Positano: orari, prezzi e imbarco | Hostel Brikette",
    description:
      "Dove imbarcarsi ad Amalfi, quanto costa nel 2026 (€9-€10), tempi di navigazione e percorso dal molo di Positano a Hostel Brikette.",
  },
  {
    contentKey: "capriPositanoFerry",
    title: "Traghetto Capri Positano: orari e biglietti 2026 | Hostel Brikette",
    description:
      "Confronto operatori, prezzi aggiornati, tempi di traversata e arrivo a Positano con percorso semplice fino a Hostel Brikette.",
  },
  {
    contentKey: "chiesaNuovaArrivals",
    title: "Da Chiesa Nuova a Hostel Brikette: fermata bus Positano",
    description:
      "Come riconoscere la fermata Chiesa Nuova / Bar Internazionale, quando chiedere all'autista di fermarsi e camminata di 2-5 minuti fino all'ostello.",
  },
  {
    contentKey: "naplesPositano",
    title: "Da Napoli a Positano: bus, treno, traghetto e transfer",
    description:
      "Percorsi da aeroporto, stazione e porto di Napoli con tempi, costi e fermata consigliata (Chiesa Nuova) per arrivare a Hostel Brikette.",
  },
  {
    contentKey: "salernoPositano",
    title: "Da Salerno a Positano: traghetto, bus e transfer",
    description:
      "Confronta traghetti stagionali, autobus SITA e transfer privati con durata, costi e consigli pratici per arrivare a Positano senza stress.",
  },
  {
    contentKey: "ferryDockToBrikette",
    title: "Dal molo di Positano a Hostel Brikette con bagagli",
    description:
      "Guida 2026 dal porto all'ostello: facchini, autobus Interno, costi aggiornati e percorso passo passo per evitare scale inutili.",
  },
  {
    contentKey: "fornilloBeachToBrikette",
    title: "Da Fornillo Beach a Hostel Brikette: percorso di rientro",
    description:
      "Rientro facile via Spiaggia Grande e autobus interno: indicazioni passo passo, tempi medi e consigli pratici dopo la giornata al mare.",
  },
  {
    contentKey: "chiesaNuovaDepartures",
    title: "Fermata bus Chiesa Nuova Positano: guida partenze SITA",
    description:
      "Dove fare la fila per Amalfi o Sorrento, come acquistare e convalidare i biglietti e come raggiungere la fermata dall'Hostel Brikette in 2-4 minuti.",
  },
  {
    contentKey: "briketteToFerryDock",
    title: "Da Hostel Brikette al porto di Positano (traghetti)",
    description:
      "Percorso a piedi aggiornato verso il molo di Spiaggia Grande con punti mappa, tempi reali e consigli per biglietti e imbarco.",
  },
];

type GuideContentPayload = {
  seo?: {
    description?: string;
    title?: string;
  };
};

describe("Italian transport guide metadata copy", () => {
  test.each(IT_TRANSPORT_CASES)(
    "uses updated SEO title/description in %s",
    ({ contentKey, title, description }) => {
      const filePath = path.join(
        process.cwd(),
        "src/locales/it/guides/content",
        `${contentKey}.json`,
      );
      const payload = JSON.parse(readFileSync(filePath, "utf8")) as GuideContentPayload;

      expect(payload.seo?.title).toBe(title);
      expect(payload.seo?.description).toBe(description);
    },
  );
});
