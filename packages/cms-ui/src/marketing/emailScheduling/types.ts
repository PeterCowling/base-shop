export interface EmailScheduleFormValues {
  subject: string;
  preheader: string;
  sendDate: string;
  sendTime: string;
  timezone: string;
  segment: string;
  followUpEnabled: boolean;
  followUpDelayHours: number;
}

export interface EmailSchedulePreviewData {
  subject: string;
  sendAtLabel: string;
  timezone: string;
  segment: string;
  followUpSummary: string;
}

export const defaultEmailScheduleValues: EmailScheduleFormValues = {
  subject: "",
  preheader: "",
  sendDate: "",
  sendTime: "09:00",
  timezone: "America/New_York", // i18n-exempt: IANA timezone identifier used as value
  segment: "all", // use segment key; UI renders human label via translations
  followUpEnabled: false,
  followUpDelayHours: 24,
};

export function getEmailSchedulePreview(
  values: EmailScheduleFormValues
): EmailSchedulePreviewData {
  // Avoid user-facing copy in preview data; UI components localise these.
  const sendAtLabel = values.sendDate ? `${values.sendDate} ${values.sendTime}` : "";
  const followUpSummary = "";

  return {
    subject: values.subject || "",
    sendAtLabel,
    timezone: values.timezone,
    segment: values.segment,
    followUpSummary,
  };
}
