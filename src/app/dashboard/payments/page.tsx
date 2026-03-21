import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n/server";

export default async function AdminPaymentsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || session.user.email !== adminEmail) {
    redirect("/dashboard");
  }

  const locale = await getServerLocale();
  const t = await getDictionary(locale);

  const payments = await prisma.cryptoPayment.findMany({
    include: {
      user: { select: { email: true, name: true, plan: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-500/20 text-yellow-400",
    CONFIRMED: "bg-green-500/20 text-green-400",
    EXPIRED: "bg-zinc-500/20 text-zinc-400",
    FAILED: "bg-red-500/20 text-red-400",
  };

  const totalConfirmed = payments
    .filter((p) => p.status === "CONFIRMED")
    .reduce((sum, p) => sum + Number(p.amountUsdt), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {t.adminPayments.title}
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            {t.adminPayments.subtitle}
          </p>
        </div>
        <div className="text-right">
          <p className="text-zinc-500 text-xs">{t.adminPayments.totalRevenue}</p>
          <p className="text-2xl font-bold text-emerald-400">
            {totalConfirmed.toFixed(2)} USDT
          </p>
        </div>
      </div>

      {payments.length === 0 ? (
        <div className="text-center text-zinc-500 py-20">
          {t.adminPayments.noPayments}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-zinc-400 text-left">
                <th className="py-3 px-3">{t.adminPayments.date}</th>
                <th className="py-3 px-3">{t.adminPayments.user}</th>
                <th className="py-3 px-3">{t.adminPayments.plan}</th>
                <th className="py-3 px-3">{t.adminPayments.billing}</th>
                <th className="py-3 px-3">{t.adminPayments.amount}</th>
                <th className="py-3 px-3">{t.adminPayments.network}</th>
                <th className="py-3 px-3">{t.adminPayments.status}</th>
                <th className="py-3 px-3">TX</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-white/5 hover:bg-white/5"
                >
                  <td className="py-3 px-3 text-zinc-400 whitespace-nowrap">
                    {new Date(p.createdAt).toLocaleString()}
                  </td>
                  <td className="py-3 px-3">
                    <div className="text-white text-sm">
                      {p.user.name || "—"}
                    </div>
                    <div className="text-zinc-500 text-xs">{p.user.email}</div>
                  </td>
                  <td className="py-3 px-3 text-white">{p.plan}</td>
                  <td className="py-3 px-3 text-zinc-400">{p.billing}</td>
                  <td className="py-3 px-3 text-white font-mono">
                    {Number(p.amountUsdt).toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-zinc-400">{p.network}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[p.status] || ""}`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    {p.txHash ? (
                      <span
                        className="text-emerald-400 text-xs font-mono truncate block max-w-[120px]"
                        title={p.txHash}
                      >
                        {p.txHash.slice(0, 8)}…{p.txHash.slice(-6)}
                      </span>
                    ) : (
                      <span className="text-zinc-600">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
