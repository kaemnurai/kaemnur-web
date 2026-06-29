import type { Metadata } from "next";
import { BackToKaemnur } from "@/components/custom/BackToKaemnur";

// This route lives OUTSIDE the (public) route group on purpose, so it does not
// inherit the main site's Navbar / sidebar / footer. The microsite stands on
// its own with a single "back to Kaemnur" link.
export const metadata: Metadata = {
  title: "Layanan Custom — Website, Web Aplikasi & Tools",
  description:
    "Buat website, web aplikasi, dan tools custom sesuai kebutuhan. Hitung estimasi awal lalu konsultasi langsung via WhatsApp.",
};

export default function CustomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full max-w-full overflow-x-clip bg-cw-bg text-cw-fg">
      <BackToKaemnur />
      {children}
    </div>
  );
}
