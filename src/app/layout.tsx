import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "KROMA FLOW — From Lead to Payment, Seamlessly | KROMAXZON TECHNOLOGIES",
  description:
    "KROMA FLOW by KROMAXZON TECHNOLOGIES: Complete B2B SaaS platform managing leads, deals, quotations, projects, tasks, team, chat, calendar, invoices, client portal, AI assistant, and workflow automation.",
  icons: {
    icon: "/logo-kmx.jpg",
    apple: "/logo-kmx.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-[#f4f8ff] text-[#0b1f44] font-sans selection:bg-[#1d6bff] selection:text-white">
        {children}
      </body>
    </html>
  );
}
