import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { Header, Footer } from "@/components/layout";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://joeflynn.io"),
  title: {
    default: "Joe Flynn",
    template: "%s | Joe Flynn",
  },
  description:
    "Personal website of Joe Flynn - thoughts on product management, AI, and technology.",
  keywords: ["product management", "AI", "technology", "blog", "portfolio"],
  authors: [{ name: "Joe Flynn" }],
  creator: "Joe Flynn",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://joeflynn.io",
    siteName: "Joe Flynn",
    title: "Joe Flynn",
    description:
      "Personal website of Joe Flynn - thoughts on product management, AI, and technology.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Joe Flynn",
    description:
      "Personal website of Joe Flynn - thoughts on product management, AI, and technology.",
    creator: "@joeflynn",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 py-8 sm:py-12">{children}</main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
