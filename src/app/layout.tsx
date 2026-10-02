import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Live Ticket Board",
  description: "Real-time customer support ticket tracking",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
