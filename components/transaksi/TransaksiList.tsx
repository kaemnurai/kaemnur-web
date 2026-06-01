"use client";

import Image from "next/image";
import Link from "next/link";
import { formatRupiah } from "@/lib/utils";
import {
  StatusBadge,
  useNow,
  formatRemaining,
  tanggalID,
  PAY_WINDOW_MS,
  type OrderClient,
} from "./shared";

export function TransaksiList({ orders }: { orders: OrderClient[] }) {
  const hasPending = orders.some((o) => o.status === "BELUM_BAYAR");
  const now = useNow(hasPending);

  return (
    <div className="space-y-3">
      {orders.map((o) => {
        const remaining = new Date(o.createdAt).getTime() + PAY_WINDOW_MS - now;
        return (
          <Link
            key={o.id}
            href={`/transaksi/${o.id}`}
            className="block rounded-card border border-line bg-card p-4 transition-colors hover:border-accent/50"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                {o.productLogoUrl ? (
                  <Image
                    src={o.productLogoUrl}
                    alt=""
                    width={40}
                    height={40}
                    className="h-10 w-10 shrink-0 rounded-btn bg-bg object-contain"
                  />
                ) : (
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-btn bg-bg text-[15px] font-bold text-accent">
                    {o.productName[0]}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-semibold text-fg">{o.productName}</p>
                  <p className="truncate text-[11px] text-fg-sub">
                    {o.orderNumber} · {tanggalID(o.createdAt)}
                  </p>
                </div>
              </div>
              <StatusBadge status={o.status} />
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-[15px] font-bold text-accent">{formatRupiah(o.amount)}</span>
              {o.status === "BELUM_BAYAR" &&
                (remaining > 0 ? (
                  <span className="text-[12px] text-fg-sub">
                    Sisa waktu bayar:{" "}
                    <span className="font-mono font-semibold text-fg">{formatRemaining(remaining)}</span>
                  </span>
                ) : (
                  <span className="text-[12px] font-medium text-danger">Waktu pembayaran habis</span>
                ))}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
