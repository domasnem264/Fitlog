import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FitLog — Sporto & Mitybos Tracker",
  description: "Jėgos treniruotės, mityba, papildai ir statistika",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="lt">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
