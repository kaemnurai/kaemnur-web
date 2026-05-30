import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Icon } from "@/components/ui/Icon";
import { getAvatarColor, getAvatarTextColor, getInitial } from "@/lib/avatar";
import { maskLicenseKey } from "@/lib/license";
import { ProfileEditForm } from "@/components/account/ProfileEditForm";
import { SignOutButton } from "@/components/account/SignOutButton";
import {
  AccountTabs,
  type InstallItem,
  type LicenseItem,
  type ReviewItem,
} from "@/components/account/AccountTabs";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Akun Saya",
  description: "Kelola profil, lisensi, unduhan, dan pengaturan akun Kaemnur Anda.",
};

const PLATFORM_LABELS: Record<string, string> = {
  WINDOWS: "Windows",
  MAC: "macOS",
  LINUX: "Linux",
};

function tanggalID(date: Date | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function tanggalSingkat(date: Date | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function Card({ title, children, id }: { title: string; children: React.ReactNode; id?: string }) {
  return (
    <div id={id} className="rounded-card border border-line bg-card p-6">
      <h2 className="mb-4 text-[15px] font-semibold text-fg">{title}</h2>
      {children}
    </div>
  );
}

function StatCard({ icon, value, label }: {
  icon: React.ComponentProps<typeof Icon>["name"];
  value: string | number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-card border border-line bg-card p-4">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-btn bg-accent/10 text-accent">
        <Icon name={icon} size={18} />
      </span>
      <div className="min-w-0">
        <p className="text-[18px] font-bold leading-tight text-fg">{value}</p>
        <p className="truncate text-[12px] text-fg-sub">{label}</p>
      </div>
    </div>
  );
}

export default async function AccountPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/account");
  }

  const [profile, downloads, ratings, licenses] = await Promise.all([
    prisma.userProfile.findUnique({ where: { id: user.id } }),
    prisma.downloadLog.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { product: { select: { id: true, name: true, slug: true, version: true } } },
    }),
    prisma.productRating.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { product: { select: { id: true, name: true, slug: true } } },
    }),
    prisma.license.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { product: { select: { name: true } } },
    }),
  ]);

  const displayName =
    profile?.displayName ??
    user.user_metadata?.display_name ??
    user.user_metadata?.full_name ??
    user.email?.split("@")[0] ??
    "User";

  const avatarUrl = profile?.avatarUrl ?? user.user_metadata?.avatar_url ?? null;
  const email = user.email ?? "";
  const memberSince = profile?.createdAt ?? new Date(user.created_at);

  const avatarBg = getAvatarColor(user.id);
  const avatarFg = getAvatarTextColor(avatarBg);
  const waLink = `https://wa.me/6282111990423?text=${encodeURIComponent(
    `Halo Admin Kaemnur, saya ${displayName} butuh bantuan.`
  )}`;

  // ── Build serializable items for the tabbed view ──────────────────────
  const installItems: InstallItem[] = downloads.map((dl) => ({
    id: dl.id,
    name: dl.product.name,
    slug: dl.product.slug,
    platform: PLATFORM_LABELS[dl.platform] ?? dl.platform,
    version: dl.product.version,
    date: tanggalID(dl.createdAt),
  }));

  const licenseItems: LicenseItem[] = licenses.map((l) => ({
    id: l.id,
    maskedKey: maskLicenseKey(l.key),
    productName: l.product.name,
    status: l.isActivated ? "aktif" : "belum",
    date: tanggalSingkat(l.createdAt),
  }));

  const reviewItems: ReviewItem[] = ratings.map((r) => ({
    id: r.id,
    name: r.product.name,
    slug: r.product.slug,
    rating: r.rating,
    reviewText: r.reviewText,
    date: tanggalSingkat(r.createdAt),
  }));

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-6 lg:px-8 lg:py-8">
      {/* 1 — Profile header */}
      <div className="overflow-hidden rounded-card border border-line bg-card">
        <div className="h-20 bg-gradient-to-r from-accent/20 via-accent/5 to-transparent" />
        <div className="flex flex-col gap-4 px-6 pb-6 sm:flex-row sm:items-end">
          <div className="-mt-10 shrink-0">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt=""
                className="h-20 w-20 rounded-full border-4 border-card object-cover"
              />
            ) : (
              <span
                className="grid h-20 w-20 place-items-center rounded-full border-4 border-card text-[30px] font-bold"
                style={{ backgroundColor: avatarBg, color: avatarFg }}
              >
                {getInitial(displayName)}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1 sm:pb-1">
            <h1 className="text-xl font-bold text-fg">{displayName}</h1>
            <p className="text-[13px] text-fg-sub">{email}</p>
            <p className="mt-0.5 flex items-center gap-1 text-[12px] text-fg-muted">
              <Icon name="users" size={12} />
              Bergabung {tanggalSingkat(memberSince)}
            </p>
          </div>
        </div>
      </div>

      {/* 2 — Stats row */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard icon="download" value={installItems.length} label="Total instalasi" />
        <StatCard icon="key" value={licenseItems.length} label="Lisensi tertaut" />
        <StatCard icon="star" value={reviewItems.length} label="Ulasan ditulis" />
      </div>

      {/* 3 — Tabbed content */}
      <div id="downloads">
        <AccountTabs installs={installItems} licenses={licenseItems} reviews={reviewItems} />
      </div>

      {/* 5 — Account settings */}
      <Card title="Pengaturan Akun">
        <ProfileEditForm initialName={displayName} email={email} />
        <div className="mt-6 border-t border-line pt-5">
          <SignOutButton />
        </div>
      </Card>

      {/* 6 — Support */}
      <div className="rounded-card border border-line bg-card p-6">
        <h2 className="mb-1 text-[15px] font-semibold text-fg">Butuh Bantuan?</h2>
        <p className="mb-4 text-[13px] text-fg-sub">
          Hubungi tim Kaemnur jika ada kendala dengan lisensi atau aplikasi.
        </p>
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-10 w-full items-center justify-center gap-2 rounded-btn bg-accent text-[13px] font-semibold text-bg hover:bg-accent-hover"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          Chat via WhatsApp
        </a>
      </div>
    </div>
  );
}
