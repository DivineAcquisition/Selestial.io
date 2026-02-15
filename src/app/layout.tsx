import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Selestial — Operational Intelligence Platform",
  description: "Multi-tenant client retention and engagement platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
