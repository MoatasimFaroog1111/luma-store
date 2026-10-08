import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Luma — Digital Products Store",
  description: "Premium digital products — planners, journals, AI prompts & templates",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#041c1c",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
