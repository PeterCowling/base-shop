export type PersonKey = "cristiana" | "peter";

export type PersonDefinition = {
  key: PersonKey;
  nameKey: string;
  secondaryNameKey?: string;
  titleKey: string;
  subtitleKey?: string;
  cardLineKey?: string;
  summaryKeys: string[];
  contact: {
    phoneLabelKey: string;
    phoneValueKey: string;
    emailLabelKey: string;
    emailValueKey: string;
    websiteLabelKey: string;
    websiteValueKey: string;
    wechatCaptionKey?: string;
    wechatValueKey?: string;
  };
};

export const PEOPLE: PersonDefinition[] = [
  {
    key: "cristiana",
    nameKey: "people.cristiana.name",
    secondaryNameKey: "people.cristiana.secondaryName",
    titleKey: "people.cristiana.title",
    subtitleKey: "people.cristiana.subtitle",
    cardLineKey: "people.cristiana.cardLine",
    summaryKeys: [
      "people.cristiana.summary.1",
      "people.cristiana.summary.2",
      "people.cristiana.summary.3",
    ],
    contact: {
      phoneLabelKey: "people.cristiana.contact.phoneLabel",
      phoneValueKey: "people.cristiana.contact.phone",
      emailLabelKey: "people.cristiana.contact.emailLabel",
      emailValueKey: "people.cristiana.contact.email",
      websiteLabelKey: "people.cristiana.contact.websiteLabel",
      websiteValueKey: "people.cristiana.contact.website",
      wechatCaptionKey: "people.cristiana.contact.wechatCaption",
      wechatValueKey: "people.cristiana.contact.wechatId",
    },
  },
  {
    key: "peter",
    nameKey: "people.peter.name",
    titleKey: "people.peter.title",
    summaryKeys: [
      "people.peter.summary.1",
      "people.peter.summary.2",
    ],
    contact: {
      phoneLabelKey: "people.peter.contact.phoneLabel",
      phoneValueKey: "people.peter.contact.phone",
      emailLabelKey: "people.peter.contact.emailLabel",
      emailValueKey: "people.peter.contact.email",
      websiteLabelKey: "people.peter.contact.websiteLabel",
      websiteValueKey: "people.peter.contact.website",
    },
  },
];
