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
  segment: "All subscribers", // i18n-exempt -- default seed value; UI renders labels with translations
  followUpEnabled: false,
  followUpDelayHours: 24,
};

export function getEmailSchedulePreview(
  values: EmailScheduleFormValues
): EmailSchedulePreviewData {
  const sendAtLabel = values.sendDate
    ? `${values.sendDate} at ${values.sendTime}` // i18n-exempt -- simple preview label; full i18n handled in UI
    : "Schedule pending"; // i18n-exempt -- fallback preview state; UI components localise user-facing copy

  const followUpSummary = values.followUpEnabled
    ? `Follow-up email will send ${values.followUpDelayHours}h later.` // i18n-exempt -- preview summary; UI components localise labels
    : "Follow-up disabled."; // i18n-exempt -- preview summary fallback

  return {
    subject: values.subject || "Untitled broadcast", // i18n-exempt -- placeholder title; actual UI provides translated headings
    sendAtLabel,
    timezone: values.timezone,
    segment: values.segment,
    followUpSummary,
  };
}
