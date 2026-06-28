import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SkyDeck — Live Flight Tracker",
  description:
    "Real-time global flight tracking. Live ADS-B aircraft positions, routes, photos, and telemetry on a fast WebGL map.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-[#04070b]">{children}</body>
    </html>
  );
}
