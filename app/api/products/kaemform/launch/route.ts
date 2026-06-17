import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createKaemFormLaunchToken } from "@/lib/kaemform-auth";

export const dynamic = "force-dynamic";

export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Login diperlukan." }, { status: 401 });
  }

  try {
    const launch = await createKaemFormLaunchToken(user);
    return NextResponse.json(launch);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Auth bridge belum dikonfigurasi.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
