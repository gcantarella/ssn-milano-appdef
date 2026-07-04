import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ricerca Strutture SSN Milano",
  description: "Trova le strutture sanitarie del Servizio Sanitario Nazionale a Milano",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
