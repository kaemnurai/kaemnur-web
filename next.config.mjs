/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  images: {
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 60,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "assets2.kaemnur.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "pub-26e373ab857a4dd38f44a93ba68e7e84.r2.dev",
        pathname: "/**",
      },
      // Admin-pasted screenshot/installer URLs can come from any https host
      // (placehold.co seed data, Supabase storage, etc.). picomatch `**`
      // matches every hostname so next/image never fails on legacy URLs.
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
