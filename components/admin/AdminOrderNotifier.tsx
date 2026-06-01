"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// Polls the pending-order count; on an increase it beeps (Web Audio API — no
// asset needed) and blinks the document title until the admin opens the orders
// page. Sound needs a prior page interaction, which is expected for admins.
const POLL_MS = 20_000;
const ORDERS_PATH = "/admin/orders";

function playBeep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.value = 0.08;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.18);
    osc.onended = () => ctx.close();
  } catch {
    // Autoplay blocked / unsupported — silently ignore.
  }
}

export function AdminOrderNotifier() {
  const pathname = usePathname();
  const lastCountRef = useRef<number | null>(null);
  const blinkRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const baseTitleRef = useRef<string>("");
  const onOrdersRef = useRef<boolean>(false);

  const stopBlink = useCallback(() => {
    if (blinkRef.current) {
      clearInterval(blinkRef.current);
      blinkRef.current = null;
    }
    if (baseTitleRef.current) document.title = baseTitleRef.current;
  }, []);

  const startBlink = useCallback(() => {
    if (blinkRef.current || onOrdersRef.current) return;
    baseTitleRef.current = document.title.replace(/^Pesanan Baru! · /, "");
    let on = false;
    blinkRef.current = setInterval(() => {
      document.title = on ? baseTitleRef.current : `Pesanan Baru! · ${baseTitleRef.current}`;
      on = !on;
    }, 1000);
  }, []);

  // Track whether we're on the orders page (acknowledges new orders).
  useEffect(() => {
    onOrdersRef.current = pathname === ORDERS_PATH;
    if (onOrdersRef.current) stopBlink();
  }, [pathname, stopBlink]);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch("/api/admin/orders/new-count");
        if (!res.ok) return;
        const data = await res.json();
        const count: number = typeof data.count === "number" ? data.count : 0;
        if (cancelled) return;
        if (lastCountRef.current !== null && count > lastCountRef.current) {
          playBeep();
          startBlink();
        }
        lastCountRef.current = count;
      } catch {
        // Network hiccup — try again next tick.
      }
    }
    poll();
    const t = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(t);
      stopBlink();
    };
  }, [startBlink, stopBlink]);

  return null;
}
