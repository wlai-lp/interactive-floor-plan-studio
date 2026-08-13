import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Interactive Floor Plan Studio",
  description: "Turn floor-plan images into semantic, interactive SVG dashboards.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <a
          href="/home-assistant-export"
          style={{
            position: "fixed",
            right: 18,
            bottom: 18,
            zIndex: 1000,
            padding: "10px 14px",
            borderRadius: 999,
            background: "#17211f",
            color: "white",
            textDecoration: "none",
            fontWeight: 700,
            boxShadow: "0 8px 24px rgba(0,0,0,.18)",
          }}
        >
          Home Assistant Export
        </a>
        {children}
      </body>
    </html>
  );
}
