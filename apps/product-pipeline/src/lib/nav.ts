export type NavItem = {
  href: string;
  labelKey: string;
  descriptionKey: string;
};

export const NAV_PRIMARY: NavItem[] = [
  {
    href: "/leads",
    labelKey: "pipeline.nav.leads.label",
    descriptionKey: "pipeline.nav.leads.description",
  },
  {
    href: "/candidates",
    labelKey: "pipeline.nav.candidates.label",
    descriptionKey: "pipeline.nav.candidates.description",
  },
  {
    href: "/scenario-lab",
    labelKey: "pipeline.nav.scenarioLab.label",
    descriptionKey: "pipeline.nav.scenarioLab.description",
  },
  {
    href: "/portfolio",
    labelKey: "pipeline.nav.portfolio.label",
    descriptionKey: "pipeline.nav.portfolio.description",
  },
];

export const NAV_SECONDARY: NavItem[] = [
  {
    href: "/launches",
    labelKey: "pipeline.nav.launches.label",
    descriptionKey: "pipeline.nav.launches.description",
  },
  {
    href: "/suppliers",
    labelKey: "pipeline.nav.suppliers.label",
    descriptionKey: "pipeline.nav.suppliers.description",
  },
  {
    href: "/logistics/lanes",
    labelKey: "pipeline.nav.logistics.label",
    descriptionKey: "pipeline.nav.logistics.description",
  },
  {
    href: "/logistics/quote-baskets",
    labelKey: "pipeline.nav.quoteBaskets.label",
    descriptionKey: "pipeline.nav.quoteBaskets.description",
  },
  {
    href: "/artifacts",
    labelKey: "pipeline.nav.artifacts.label",
    descriptionKey: "pipeline.nav.artifacts.description",
  },
  {
    href: "/activity",
    labelKey: "pipeline.nav.activity.label",
    descriptionKey: "pipeline.nav.activity.description",
  },
];
