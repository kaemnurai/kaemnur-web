"use client";

import { useEffect } from "react";

// Runs inside the authenticated admin layout.
// Sets localStorage flags so the community AdminReplyForm can detect admin session.
export function AdminMarker({ token }: { token: string }) {
  useEffect(() => {
    localStorage.setItem("kaemnur_admin", "true");
    localStorage.setItem("kaemnur_admin_secret", token);
  }, [token]);
  return null;
}
