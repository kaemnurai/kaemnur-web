import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Icon } from "@/components/ui/Icon";
import { getAvatarColor, getAvatarTextColor, getInitial } from "@/lib/avatar";
import { maskLicenseKey } from "@/lib/license";
import { ProfileEditForm } from "@/components/account/ProfileEditForm";
import { AvatarUpload } from "@/components/account/AvatarUpload";
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

function Card({ title, icon, children, id }: {
  title: string;
  icon?: React.ComponentProps<typeof Icon>["name"];
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className="rounded-card border border-line bg-card">
      <div className="flex items-center gap-2 border-b border-line px-5 py-4">
        {icon && <Icon name={icon} size={16} className="text-accent" />}
        <h2 className="text-[15px] font-semibold text-fg">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function HeaderStat({ icon, value, label }: {
  icon: React.ComponentProps<typeof Icon>["name"];
  value: string | number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-btn border border-line bg-bg px-3 py-2.5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-btn bg-accent/10 text-accent">
        <Icon name={icon} size={17} />
      </span>
      <div className="min-w-0">
        <p className="text-[17px] font-bold leading-tight text-fg">{value}</p>
        <p className="truncate text-[11px] text-fg-sub">{label}</p>
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

  const licenseItems: LicenseItem[] = licenses.map((l) => {
    const expired = l.expiresAt ? new Date(l.expiresAt) < new Date() : false;
    return {
      id: l.id,
      maskedKey: maskLicenseKey(l.key),
      productName: l.product.name,
      status: expired ? "expired" : l.isActivated ? "aktif" : "belum",
      expiry: l.expiresAt ? `Berlaku s/d ${tanggalSingkat(l.expiresAt)}` : "Selamanya",
      date: tanggalSingkat(l.createdAt),
    };
  });

  const reviewItems: ReviewItem[] = ratings.map((r) => ({
    id: r.id,
    name: r.product.name,
    slug: r.product.slug,
    rating: r.rating,
    reviewText: r.reviewText,
    date: tanggalSingkat(r.createdAt),
  }));

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-6 lg:px-8 lg:py-8">
      {/* 1 — Profile header with inline stats */}
      <header className="rounded-card border border-line bg-card p-5 sm:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt=""
                className="h-16 w-16 shrink-0 rounded-full object-cover ring-2 ring-line sm:h-20 sm:w-20"
              />
            ) : (
              <span
                className="grid h-16 w-16 shrink-0 place-items-center rounded-full text-[26px] font-bold ring-2 ring-line sm:h-20 sm:w-20 sm:text-[30px]"
                style={{ backgroundColor: avatarBg, color: avatarFg }}
              >
                {getInitial(displayName)}
              </span>
            )}
            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold text-fg sm:text-2xl">{displayName}</h1>
              <p className="truncate text-[13px] text-fg-sub">{email}</p>
              <p className="mt-1 flex items-center gap-1.5 text-[12px] text-fg-muted">
                <Icon name="calendar" size={13} />
                Bergabung {tanggalSingkat(memberSince)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 lg:w-auto">
            <HeaderStat icon="download" value={installItems.length} label="Total Instalasi" />
            <HeaderStat icon="key" value={licenseItems.length} label="Lisensi Tertaut" />
            <HeaderStat icon="star" value={reviewItems.length} label="Ulasan Ditulis" />
          </div>
        </div>
      </header>

      {/* 2 — Two-column body */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Left: activity sections */}
        <div className="lg:col-span-2">
          <AccountTabs
            installs={installItems}
            licenses={licenseItems}
            reviews={reviewItems}
            waLink={waLink}
          />
        </div>

        {/* Right: settings + support */}
        <aside className="space-y-4">
          <Card title="Pengaturan Akun" icon="user">
            <ProfileEditForm initialName={displayName} email={email} />
            {!avatarUrl && (
              <div className="mt-5 border-t border-line pt-5">
                <AvatarUpload userId={user.id} initialUrl={avatarUrl} fallbackName={displayName} />
              </div>
            )}
            <div className="mt-5 border-t border-line pt-5">
              <SignOutButton />
            </div>
          </Card>

          <Card title="Butuh Bantuan?" icon="headphones">
            <p className="mb-4 text-[13px] leading-relaxed text-fg-sub">
              Hubungi tim Kaemnur jika ada kendala dengan lisensi atau aplikasi.
            </p>
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-10 w-full items-center justify-center gap-2 rounded-btn bg-accent text-[13px] font-semibold text-bg transition-colors hover:bg-accent-hover"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Hubungi via WhatsApp
            </a>
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-btn border border-line text-[13px] font-medium text-fg-sub transition-colors hover:border-fg-muted hover:text-fg"
            >
              <Icon name="external-link" size={14} />
              Buka WhatsApp Web
            </a>
          </Card>
        </aside>
      </div>
    </div>
  );
}
