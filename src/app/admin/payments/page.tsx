import { prisma } from "@/lib/prisma";
import { PaymentsClient } from "./payments-client";

export default async function AdminPaymentsPage() {
  const cryptoPayments = await prisma.cryptoPayment.findMany({
    include: {
      user: { select: { email: true, name: true, plan: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const cardPayments = await prisma.cardPayment.findMany({
    include: {
      user: { select: { email: true, name: true, plan: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const totalCryptoConfirmed = cryptoPayments
    .filter((p) => p.status === "CONFIRMED")
    .reduce((sum, p) => sum + Number(p.amountUsdt), 0);

  const totalCardRevenue = cardPayments
    .filter((p) => p.status === "active")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const serializedCrypto = cryptoPayments.map((p) => ({
    id: p.id,
    userName: p.user.name,
    userEmail: p.user.email,
    userPlan: p.user.plan,
    plan: p.plan,
    billing: p.billing,
    amountUsdt: Number(p.amountUsdt),
    network: p.network,
    status: p.status,
    txHash: p.txHash,
    createdAt: p.createdAt.toISOString(),
  }));

  const serializedCard = cardPayments.map((p) => ({
    id: p.id,
    userName: p.user.name,
    userEmail: p.user.email,
    userPlan: p.user.plan,
    plan: p.plan,
    billing: p.billing,
    amount: Number(p.amount),
    currency: p.currency,
    provider: p.provider,
    status: p.status,
    subscriptionId: p.subscriptionId,
    createdAt: p.createdAt.toISOString(),
  }));

  return (
    <PaymentsClient
      cryptoPayments={serializedCrypto}
      cardPayments={serializedCard}
      totalCryptoConfirmed={totalCryptoConfirmed}
      totalCardRevenue={totalCardRevenue}
    />
  );
}
