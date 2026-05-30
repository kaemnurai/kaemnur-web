"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import NProgress from "nprogress";

// NProgress is configured once at module load — idempotent.
NProgress.configure({ showSpinner: false, trickleSpeed: 200, minimum: 0.08 });

export function ProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    NProgress.done();
  }, [pathname, searchParams]);

  useEffect(() => {
    // Intercept link clicks to start the bar before navigation.
    // We can't hook into Next.js router events directly in App Router, so we
    // listen to document-level clicks on anchor elements.
    function onLinkClick(e: MouseEvent) {
      const anchor = (e.target as Element).closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href") ?? "";
      // Only internal same-origin navigations
      if (
        href.startsWith("/") &&
        !href.startsWith("//") &&
        !anchor.hasAttribute("download") &&
        anchor.target !== "_blank"
      ) {
        NProgress.start();
      }
    }

    document.addEventListener("click", onLinkClick);
    return () => document.removeEventListener("click", onLinkClick);
  }, []);

  return null;
}
