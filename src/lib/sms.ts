import twilio from "twilio";
import { logger } from "@/lib/logger";

let _client: ReturnType<typeof twilio> | null = null;

function getClient() {
  if (!_client) {
    _client = twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    );
  }
  return _client;
}

export async function sendSMS(to: string, body: string): Promise<boolean> {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    logger.warn("Twilio not configured, skipping SMS");
    return false;
  }

  try {
    const client = getClient();
    await client.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER!,
      to,
    });
    return true;
  } catch (error) {
    logger.error({ error }, "Failed to send SMS");
    return false;
  }
}
