import { Resend } from "resend";
import { logger } from "@/lib/logger";

const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = process.env.EMAIL_FROM || "LastEnvelope <noreply@lastenvelope.com>";

export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    logger.warn("Resend not configured, skipping email");
    return false;
  }

  try {
    await resend.emails.send({
      from: fromEmail,
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    logger.error({ error }, "Failed to send email");
    return false;
  }
}
