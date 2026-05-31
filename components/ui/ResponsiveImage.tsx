import Image from "next/image";
import { cn } from "@/lib/utils";

// Reusable image that never crops: object-contain inside a fixed aspect-ratio
// box. Used for product galleries, hero previews, and screenshot cards so any
// viewport (320px → 4K) shows the whole image.
export function ResponsiveImage({
  src,
  alt,
  priority = false,
  className,
  containerClassName,
  aspectRatio = "16/10",
  transparent = false,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 1200px",
}: {
  src: string;
  alt: string;
  priority?: boolean;
  className?: string;
  containerClassName?: string;
  aspectRatio?: string;
  transparent?: boolean;
  sizes?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl",
        transparent ? "" : "bg-gradient-to-br from-[#1A1F2E] to-[#0F1419]",
        containerClassName
      )}
      style={{ aspectRatio }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        style={{ objectFit: "contain", objectPosition: "center" }}
        className={className}
      />
    </div>
  );
}
