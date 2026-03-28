import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { getDictionary, rtlLocales } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n/server";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://lastenvelope.com";

export const metadata: Metadata = {
  title: {
    default: "LastEnvelope — Digital Vault for Your Legacy",
    template: "%s | LastEnvelope",
  },
  description:
    "Securely store passwords, documents, and final messages. Assign beneficiaries. If you stop responding — they receive their envelopes.",
  metadataBase: new URL(BASE_URL),
  keywords: [
    "digital legacy",
    "encrypted vault",
    "dead man's switch",
    "password inheritance",
    "beneficiary",
    "zero-knowledge encryption",
    "digital will",
    "estate planning",
  ],
  authors: [{ name: "LastEnvelope" }],
  creator: "LastEnvelope",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: BASE_URL,
    siteName: "LastEnvelope",
    title: "LastEnvelope — Digital Vault for Your Legacy",
    description:
      "Store passwords, documents, and final messages in a zero-knowledge encrypted vault. If you stop responding — your beneficiaries receive their envelopes.",
  },
  twitter: {
    card: "summary_large_image",
    title: "LastEnvelope — Digital Vault for Your Legacy",
    description:
      "Zero-knowledge encrypted vault with Dead Man's Switch. Your legacy, securely delivered.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getServerLocale();
  const dir = rtlLocales.includes(locale) ? "rtl" : "ltr";
  const dictionary = await getDictionary(locale);

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100">
        <Providers locale={locale} dictionaryJson={JSON.stringify(dictionary)}>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
