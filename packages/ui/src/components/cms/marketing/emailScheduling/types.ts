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
  timezone: "America/New_York",
  segment: "All subscribers",
  followUpEnabled: false,
  followUpDelayHours: 24,
};

export function getEmailSchedulePreview(
  values: EmailScheduleFormValues
): EmailSchedulePreviewData {
  const sendAtLabel = values.sendDate
    ? `${values.sendDate} at ${values.sendTime}`
    : "Schedule pending";

  const followUpSummary = values.followUpEnabled
    ? `Follow-up email will send ${values.followUpDelayHours}h later.`
    : "Follow-up disabled.";

  return {
    subject: values.subject || "Untitled broadcast",
    sendAtLabel,
    timezone: values.timezone,
    segment: values.segment,
    followUpSummary,
  };
}
