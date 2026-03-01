import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ockham — Test-Driven Delivery, Powered by AI Collaboration",
  description:
    "Ockham is a desktop app for test-driven software delivery. It scans your codebase, generates spec tests, and collaborates with AI to ensure quality at every step.",
  openGraph: {
    title: "Ockham — Test-Driven Delivery, Powered by AI Collaboration",
    description:
      "Desktop app for test-driven software delivery with AI collaboration.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
