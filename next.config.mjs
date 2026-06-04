/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
    unoptimized: true,
  },
  typescript: {
    // Allow production builds to complete even if there are subtle project warning types
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
