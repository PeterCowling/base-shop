export type PersonKey = "cristiana" | "peter";

export type PersonDefinition = {
  key: PersonKey;
  nameKey: string;
  secondaryNameKey?: string;
  titleKey: string;
  titleEnKey?: string;
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
    titleEnKey: "people.cristiana.titleEn",
    subtitleKey: "people.cristiana.subtitle",
    cardLineKey: "people.cristiana.cardLine",
    summaryKeys: [
      "people.cristiana.summary.1",
      "people.cristiana.summary.2",
      "people.cristiana.summary.3",
      "people.cristiana.summary.4",
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
    secondaryNameKey: "people.peter.secondaryName",
    titleKey: "people.peter.title",
    titleEnKey: "people.peter.titleEn",
    cardLineKey: "people.peter.cardLine",
    summaryKeys: [
      "people.peter.summary.1",
      "people.peter.summary.2",
      "people.peter.summary.3",
      "people.peter.summary.4",
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

type ContactFieldMapping = {
  label: keyof PersonDefinition["contact"];
  value: keyof PersonDefinition["contact"];
  hrefPrefix: "tel:" | "mailto:" | "https://";
};

const CONTACT_LINK_FIELDS: ContactFieldMapping[] = [
  { label: "phoneLabelKey", value: "phoneValueKey", hrefPrefix: "tel:" },
  { label: "emailLabelKey", value: "emailValueKey", hrefPrefix: "mailto:" },
  { label: "websiteLabelKey", value: "websiteValueKey", hrefPrefix: "https://" },
];

export type ContactRowDefinition = {
  labelKey: string;
  valueKey: string;
  hrefPrefix: ContactFieldMapping["hrefPrefix"];
};

export function getContactRowsForPerson(personKey: PersonKey): ContactRowDefinition[] {
  const person = PEOPLE.find((entry) => entry.key === personKey);
  if (!person) {
    return [];
  }

  return CONTACT_LINK_FIELDS.flatMap((field) => {
    const labelKey = person.contact[field.label];
    const valueKey = person.contact[field.value];
    if (!labelKey || !valueKey) {
      return [];
    }

    return [
      {
        labelKey,
        valueKey,
        hrefPrefix: field.hrefPrefix,
      },
    ];
  });
}
