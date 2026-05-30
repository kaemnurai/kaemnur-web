import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Icon } from "@/components/ui/Icon";
import { getAvatarColor, getAvatarTextColor, getInitial } from "@/lib/avatar";
import { ProfileEditForm } from "@/components/account/ProfileEditForm";
import { SignOutButton } from "@/components/account/SignOutButton";

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

function Stars({ value }: { value: number }) {
  return (
    <span className="text-[15px]">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= value ? "text-accent" : "text-fg-muted/30"}>
          ★
        </span>
      ))}
    </span>
  );
}

const WA_SUPPORT =
  "https://wa.me/6282111990423?text=Halo+Admin+Kaemnur%2C+saya+butuh+bantuan.";

export default async function AccountPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/account");
  }

  const [profile, downloads, ratings] = await Promise.all([
    prisma.userProfile.findUnique({ where: { id: user.id } }),
    prisma.downloadLog.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { product: { select: { id: true, name: true, slug: true } } },
    }),
    prisma.productRating.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { product: { select: { id: true, name: true, slug: true } } },
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

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-6 lg:px-8 lg:py-8">
      {/* 1 — Profile header */}
      <div className="rounded-card border border-line bg-card p-6">
        <div className="flex items-start gap-4">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt=""
              className="h-16 w-16 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span
              className="grid h-16 w-16 shrink-0 place-items-center rounded-full text-[24px] font-bold"
              style={{ backgroundColor: avatarBg, color: avatarFg }}
            >
              {getInitial(displayName)}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-fg">{displayName}</h1>
            <p className="text-[13px] text-fg-sub">{email}</p>
            <p className="mt-0.5 text-[12px] text-fg-muted">
              Bergabung {tanggalSingkat(memberSince)}
            </p>
          </div>
        </div>
      </div>

      {/* 2 — Licenses */}
      <Card title="Lisensi Saya">
        <div className="rounded-btn border border-dashed border-line bg-bg px-4 py-8 text-center">
          <Icon name="key" size={24} className="mx-auto text-fg-muted" />
          <p className="mt-3 text-[13px] font-medium text-fg">Belum ada lisensi</p>
          <p className="mt-1.5 max-w-xs mx-auto text-[12px] leading-relaxed text-fg-sub">
            Lisensi PRO akan muncul di sini setelah tim Kaemnur menghubungkan
            kunci ke akun Anda. Hubungi kami via WhatsApp untuk konfirmasi.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <a
              href={WA_SUPPORT}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-btn bg-accent px-3 text-[12px] font-semibold text-bg hover:bg-accent-hover"
            >
              <Icon name="send" size={13} />
              Hubungi Admin
            </a>
            <Link
              href="/download"
              className="inline-flex h-9 items-center gap-1.5 rounded-btn border border-line px-3 text-[12px] font-medium text-fg-sub hover:bg-card-hover hover:text-fg"
            >
              <Icon name="download" size={13} />
              Upgrade ke PRO
            </Link>
          </div>
        </div>
      </Card>

      {/* 3 — Download history */}
      <Card title="Riwayat Unduhan" id="downloads">
        {downloads.length === 0 ? (
          <div className="rounded-btn border border-dashed border-line bg-bg px-4 py-8 text-center">
            <Icon name="download" size={24} className="mx-auto text-fg-muted" />
            <p className="mt-3 text-[13px] font-medium text-fg">Belum ada riwayat unduhan</p>
            <Link
              href="/download"
              className="mt-3 inline-block text-[12px] font-medium text-accent hover:underline"
            >
              Cari aplikasi untuk diunduh →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-line">
            {downloads.map((dl) => (
              <div key={dl.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <Link
                    href={`/products/${dl.product.slug}`}
                    className="text-[14px] font-semibold text-fg hover:text-accent"
                  >
                    {dl.product.name}
                  </Link>
                  <p className="text-[12px] text-fg-sub">{tanggalID(dl.createdAt)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="rounded bg-line px-2 py-0.5 text-[11px] font-semibold text-fg-sub">
                    {PLATFORM_LABELS[dl.platform] ?? dl.platform}
                  </span>
                  <Link
                    href={`/products/${dl.product.slug}`}
                    className="inline-flex h-7 items-center gap-1 rounded px-2 text-[11px] font-medium text-accent hover:bg-accent/10"
                  >
                    <Icon name="download" size={11} />
                    Unduh Lagi
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 4 — Ratings */}
      <Card title="Ulasan Saya">
        {ratings.length === 0 ? (
          <div className="rounded-btn border border-dashed border-line bg-bg px-4 py-8 text-center">
            <Icon name="star" size={24} className="mx-auto text-fg-muted" />
            <p className="mt-3 text-[13px] font-medium text-fg">Belum memberikan ulasan</p>
            <Link
              href="/"
              className="mt-3 inline-block text-[12px] font-medium text-accent hover:underline"
            >
              Jelajahi produk untuk dinilai →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-line">
            {ratings.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <Link
                    href={`/products/${r.product.slug}`}
                    className="text-[14px] font-semibold text-fg hover:text-accent"
                  >
                    {r.product.name}
                  </Link>
                  <p className="text-[12px] text-fg-sub">{tanggalSingkat(r.createdAt)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Stars value={r.rating} />
                  <Link
                    href={`/products/${r.product.slug}`}
                    className="text-[11px] font-medium text-accent hover:underline"
                  >
                    Ubah Rating
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

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
