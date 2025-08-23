// packages/email/src/sendEmail.ts
import { coreEnv } from "@acme/config/env/core";
import nodemailer from "nodemailer";
import pino from "pino";
import { getDefaultSender } from "./config";
const hasCreds = coreEnv.GMAIL_USER && coreEnv.GMAIL_PASS;
const transporter = hasCreds
    ? nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: coreEnv.GMAIL_USER,
            pass: coreEnv.GMAIL_PASS,
        },
    })
    : null;
const logger = pino({
    level: process.env.EMAIL_LOG_LEVEL ?? "silent",
});
export async function sendEmail(to, subject, body) {
    if (transporter) {
        try {
            await transporter.sendMail({
                from: getDefaultSender(),
                to,
                subject,
                text: body,
            });
        }
        catch (error) {
            console.error("Error sending email", error);
            throw error;
        }
    }
    else {
        logger.info({ to }, "Email simulated");
    }
}
