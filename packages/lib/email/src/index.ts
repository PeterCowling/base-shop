import nodemailer from "nodemailer";

export interface CampaignEmail {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

export async function sendCampaign(mail: CampaignEmail): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: process.env.SMTP_USER
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        }
      : undefined,
  });

  await transporter.sendMail({
    from: mail.from || process.env.SMTP_FROM || process.env.SMTP_USER,
    to: mail.to,
    subject: mail.subject,
    html: mail.html,
  });
}
