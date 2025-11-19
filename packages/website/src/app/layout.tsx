import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import { AutoRefresh } from "@/components/AutoRefresh";
import { CommandPalette } from "@/components/CommandPalette";
import { DocFooter } from "@/components/DocFooter";
import { DocHeader } from "@/components/DocHeader";
import { SITE_URL } from "@/constants/urls";
import {
  getDocSearchDocuments,
  serializeSearchDocuments,
} from "@/lib/doc-search";
import { getDocTitles } from "@/lib/mdx";
import { SoundSettingsProvider } from "@/lib/useSoundSettings";
import "./globals.css";

const commitMono = localFont({
  src: "../../public/fonts/commit-mono/CommitMono-Variable.ttf",
  variable: "--font-commit-mono",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteName = "Effect Solutions";
const siteDescription =
  "Effect Solutions provides best practices and patterns for building resilient TypeScript applications with Effect.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  keywords: [
    "Effect Solutions",
    "Effect",
    "TypeScript",
    "Functional Programming",
    "Resilient Systems",
    "Error Handling",
    "Best Practices",
  ],
  openGraph: {
    title: siteName,
    description: siteDescription,
    url: "/",
    siteName,
    images: [
      {
        url: "/og/home.png",
        width: 1200,
        height: 630,
        alt: siteName,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description: siteDescription,
    images: ["/og/home.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const documents = serializeSearchDocuments(getDocSearchDocuments());
  const docTitles = getDocTitles();

  return (
    <html lang="en">
      <body
        className={`${commitMono.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
      >
        <CommandPalette documents={documents} />
        <AutoRefresh />
        <SoundSettingsProvider>
          <DocHeader docTitles={docTitles} />
          {children}
          <DocFooter />
        </SoundSettingsProvider>
        <Analytics />
      </body>
    </html>
  );
}
