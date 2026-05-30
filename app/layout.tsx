import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import { ProgressBar } from "@/components/ui/ProgressBar";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Kaemnur — Practical Productivity Software",
    template: "%s — Kaemnur",
  },
  description:
    "Offline-first, lightweight productivity apps. Free to download, PRO when you're ready.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-bg font-sans text-fg antialiased">
        {/* ProgressBar uses useSearchParams — must be inside Suspense */}
        <Suspense fallback={null}>
          <ProgressBar />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
