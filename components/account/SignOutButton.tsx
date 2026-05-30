"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="flex h-10 w-full items-center justify-center rounded-btn border border-danger/40 text-[13px] font-semibold text-danger hover:bg-danger/10"
    >
      Keluar dari Akun
    </button>
  );
}
