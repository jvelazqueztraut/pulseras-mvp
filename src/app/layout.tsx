import "./globals.css";
import { PulserasProvider } from "@/context/PulserasContext";
import { AppShell } from "@/components/AppShell";
import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pulseras",
  description: "Detect nearby Bluetooth Low Energy devices without pairing.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#080c16",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} h-full antialiased`}>
      <body className="min-h-full">
        <PulserasProvider>
          <AppShell>{children}</AppShell>
        </PulserasProvider>
      </body>
    </html>
  );
}
