import { type EmailService, getEmailService } from "../../services/emailService";
import { getTrackingStatus, type TrackingStatus } from "../../shipping";

export interface TrackingItem {
  id: string;
  type: "shipment" | "return";
  provider: string;
  trackingNumber: string;
}

export interface DashboardRecord extends TrackingItem, TrackingStatus {}

export async function getTrackingDashboard(
  items: TrackingItem[],
  customProviders: Record<string, (trackingNumber: string) => Promise<TrackingStatus>> = {},
): Promise<DashboardRecord[]> {
  const records: DashboardRecord[] = [];
  for (const item of items) {
    const handler = customProviders[item.provider];
    let status: TrackingStatus = { status: null, steps: [] };
    if (handler) {
      status = await handler(item.trackingNumber);
    } else if (item.provider === "ups" || item.provider === "dhl") {
      status = await getTrackingStatus({
        provider: item.provider as "ups" | "dhl",
        trackingNumber: item.trackingNumber,
      });
    }
    records.push({ ...item, ...status });
  }
  return records;
}

export interface TrackingContact {
  email?: string;
  phone?: string;
}

async function sendSms(to: string, body: string): Promise<void> {
  const sid = process.env.TWILIO_SID;
  const token = process.env.TWILIO_TOKEN;
  const from = process.env.TWILIO_FROM;
  if (!sid || !token || !from) return;
  await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString(
          "base64",
        )}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        From: from,
        To: to,
        Body: body,
      }).toString(),
    },
  );
}

export async function notifyStatusChange(
  contact: TrackingContact,
  item: TrackingItem,
  previous: string | null,
  current: string | null,
  email: EmailService = getEmailService(),
): Promise<void> {
  if (previous === current) return;
  const message = `Tracking update for ${item.id}: ${
    current ?? "unknown"
  }`; // i18n-exempt -- CORE-1011 system notification content
  if (contact.email) {
    await email.sendEmail(
      contact.email,
      "Tracking update",
      message,
    ); // i18n-exempt -- CORE-1011 system notification subject
  }
  if (contact.phone) {
    await sendSms(contact.phone, message);
  }
}

