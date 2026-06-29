import { CustomPageClient } from "@/components/custom/CustomPageClient";

// Fully static & self-contained: no DB reads, no global layout. All the heavy
// interactive bits (previews, calculator) live in client components that are
// only ever imported from this route, so the homepage bundle is untouched.
export default function CustomPage() {
  return <CustomPageClient />;
}
