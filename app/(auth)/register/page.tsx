import { redirect } from "next/navigation";
import { getAuthRedirectPath } from "@/lib/auth-redirect";

export default function RegisterPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const redirectTo = getAuthRedirectPath(searchParams);
  redirect(`/signup?redirect=${encodeURIComponent(redirectTo)}`);
}
