import type { Metadata } from "next";
import localFont from "next/font/local";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FooterStack from "@/components/scroll/FooterStack";
import "@fontsource-variable/dm-sans";
import "./globals.css";

// Primary display face — variable, 200-700, used for headings, buttons and labels.
const clash = localFont({
  src: "../../public/fonts/ClashDisplay-Variable.woff2",
  weight: "200 700",
  style: "normal",
  variable: "--font-clash",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Manhattan Motors",
  description: "Quality vehicles exported from Japan",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} className={`${clash.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-body" style={{ backgroundColor: "#0A0E14", color: "#fff" }}>
        {/* Page-level continuous blue glow */}
        <div aria-hidden="true" style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: -1, overflow: "hidden" }}>
          <div style={{ position: "absolute", top: "5vh", left: "50%", marginLeft: "-450px", width: "900px", height: "600px", background: "radial-gradient(ellipse at center, rgba(45,127,249,0.10) 0%, transparent 65%)" }} />
          <div style={{ position: "absolute", top: "45vh", left: "30%", width: "700px", height: "500px", background: "radial-gradient(ellipse at center, rgba(45,127,249,0.07) 0%, transparent 60%)" }} />
          <div style={{ position: "absolute", bottom: "5vh", right: "25%", width: "800px", height: "500px", background: "radial-gradient(ellipse at center, rgba(45,127,249,0.09) 0%, transparent 62%)" }} />
        </div>
        <NextIntlClientProvider messages={messages}>
          <Navbar />
          <main className="flex flex-1 flex-col pt-[88px]">{children}</main>
          <FooterStack>
            <Footer />
          </FooterStack>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
