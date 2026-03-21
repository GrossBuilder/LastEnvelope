import { sendSMS } from "@/lib/sms";
import { sendEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// ─── Check-in Reminder (sent to the user during grace period) ───

export async function sendCheckInReminder(user: {
  id: string;
  email: string;
  name: string | null;
}) {
  const name = user.name || "there";

  // Email
  await sendEmail(
    user.email,
    "⚠️ LastEnvelope — Check-in Required",
    `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #10b981;">LastEnvelope</h2>
      <p>Hi ${name},</p>
      <p>You missed your scheduled check-in. Your Dead Man's Switch is now in the <strong>grace period</strong>.</p>
      <p>If you don't check in before the grace period ends, your beneficiaries will be notified and receive their assigned vault items.</p>
      <p style="margin: 24px 0;">
        <a href="${appUrl}/switch" 
           style="background: #10b981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Check In Now
        </a>
      </p>
      <p style="color: #71717a; font-size: 14px;">If this is unexpected, please check in immediately.</p>
    </div>
    `
  );

  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: "CHECK_IN_REMINDER_SENT",
      details: `Reminder email sent to ${user.email}`,
    },
  });
}

// ─── Switch Triggered (sent to beneficiaries) ───

export async function notifyBeneficiaries(userId: string) {
  const beneficiaries = await prisma.beneficiary.findMany({
    where: { userId },
    include: {
      items: {
        include: {
          vaultItem: {
            select: { title: true, type: true },
          },
        },
      },
    },
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });

  const senderName = user?.name || "Someone";

  for (const ben of beneficiaries) {
    const itemList = ben.items
      .map((i) => `• ${i.vaultItem.title} (${i.vaultItem.type.toLowerCase()})`)
      .join("<br>");

    // Email to beneficiary
    await sendEmail(
      ben.email,
      `${senderName} has left you a digital envelope — LastEnvelope`,
      `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #10b981;">LastEnvelope</h2>
        <p>Dear ${ben.name},</p>
        <p><strong>${senderName}</strong> has designated you as a beneficiary in their digital legacy vault.</p>
        <p>Their Dead Man's Switch has been triggered, which means they have not checked in within their configured time period.</p>
        ${
          ben.items.length > 0
            ? `<p>The following items have been assigned to you:</p><div style="background: #18181b; padding: 16px; border-radius: 8px; color: #d4d4d8;">${itemList}</div>`
            : ""
        }
        <p style="margin-top: 24px; color: #71717a; font-size: 14px;">
          You will receive access instructions separately. If you believe this was sent in error, please disregard this message.
        </p>
      </div>
      `
    );

    // SMS to beneficiary (if phone number exists)
    if (ben.phone) {
      await sendSMS(
        ben.phone,
        `LastEnvelope: ${senderName} has left you a digital envelope. Check your email (${ben.email}) for details.`
      );
    }

    await prisma.activityLog.create({
      data: {
        userId,
        action: "BENEFICIARY_NOTIFIED",
        details: `Notified ${ben.name} (${ben.email}) — ${ben.items.length} items assigned`,
      },
    });
  }

  return beneficiaries.length;
}

// ─── Subscription notifications ───

export async function sendUpgradeConfirmation(
  email: string,
  name: string | null,
  plan: string
) {
  await sendEmail(
    email,
    `🎉 Welcome to LastEnvelope ${plan}!`,
    `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #10b981;">LastEnvelope</h2>
      <p>Hi ${name || "there"},</p>
      <p>Your plan has been upgraded to <strong>${plan}</strong>. All premium features are now unlocked!</p>
      <p style="margin: 24px 0;">
        <a href="${appUrl}/dashboard" 
           style="background: #10b981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Go to Dashboard
        </a>
      </p>
    </div>
    `
  );
}

// ─── Crypto payment confirmation ───

export async function sendPaymentConfirmation(
  email: string,
  name: string | null,
  plan: string,
  amount: number,
  txHash: string,
  expiresAt: Date
) {
  const expiryStr = expiresAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const truncatedTx = txHash.slice(0, 12) + "..." + txHash.slice(-8);

  await sendEmail(
    email,
    `✅ Payment confirmed — LastEnvelope ${plan}`,
    `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #10b981;">LastEnvelope</h2>
      <p>Hi ${name || "there"},</p>
      <p>Your USDT payment has been <strong>verified on the blockchain</strong> and your subscription is now active.</p>
      <div style="background: #18181b; padding: 16px; border-radius: 8px; color: #d4d4d8; margin: 16px 0;">
        <p style="margin: 4px 0;"><strong>Plan:</strong> ${plan}</p>
        <p style="margin: 4px 0;"><strong>Amount:</strong> ${amount} USDT</p>
        <p style="margin: 4px 0;"><strong>TX:</strong> <a href="https://tronscan.org/#/transaction/${txHash}" style="color: #10b981;">${truncatedTx}</a></p>
        <p style="margin: 4px 0;"><strong>Active until:</strong> ${expiryStr}</p>
      </div>
      <p style="margin: 24px 0;">
        <a href="${appUrl}/dashboard" 
           style="background: #10b981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Go to Dashboard
        </a>
      </p>
      <p style="color: #71717a; font-size: 13px;">Keep this email as your payment receipt.</p>
    </div>
    `
  );
}

// ─── Subscription expiry reminder ───

export async function sendSubscriptionExpiryReminder(
  email: string,
  name: string | null,
  plan: string,
  expiresAt: Date
) {
  const expiryStr = expiresAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  await sendEmail(
    email,
    `⏳ Your LastEnvelope ${plan} plan expires soon`,
    `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #10b981;">LastEnvelope</h2>
      <p>Hi ${name || "there"},</p>
      <p>Your <strong>${plan}</strong> subscription expires on <strong>${expiryStr}</strong>.</p>
      <p>Renew now to keep access to your premium features and ensure your beneficiaries stay protected.</p>
      <p style="margin: 24px 0;">
        <a href="${appUrl}/pricing" 
           style="background: #10b981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Renew Subscription
        </a>
      </p>
      <p style="color: #71717a; font-size: 13px;">If you don't renew, your plan will revert to Free.</p>
    </div>
    `
  );
}
