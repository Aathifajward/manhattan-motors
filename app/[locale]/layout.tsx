import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
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
    <html
      lang={locale}
      className={`${spaceGrotesk.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans" style={{ backgroundColor: "#0A0E14", color: "#fff" }}>
        {/* Page-level continuous blue glow */}
        <div aria-hidden="true" style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: -1, overflow: "hidden" }}>
          <div style={{ position: "absolute", top: "5vh", left: "50%", transform: "translateX(-50%)", width: "900px", height: "600px", background: "radial-gradient(ellipse at center, rgba(45,127,249,0.10) 0%, transparent 65%)", filter: "blur(40px)" }} />
          <div style={{ position: "absolute", top: "45vh", left: "30%", width: "700px", height: "500px", background: "radial-gradient(ellipse at center, rgba(45,127,249,0.07) 0%, transparent 60%)", filter: "blur(60px)" }} />
          <div style={{ position: "absolute", bottom: "5vh", right: "25%", width: "800px", height: "500px", background: "radial-gradient(ellipse at center, rgba(45,127,249,0.09) 0%, transparent 62%)", filter: "blur(50px)" }} />
        </div>
        <NextIntlClientProvider messages={messages}>
          <Navbar />
          <main className="flex flex-1 flex-col pt-[88px]">{children}</main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}