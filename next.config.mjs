/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "pub-2a25837c4e2f44a4850adb4b84f5cfdb.r2.dev",
      },
      {
        protocol: "https",
        hostname: "pub-f81cd2b1911147b5861ba91efa5d22da.r2.dev",
      },
    ],
  },
};

export default nextConfig;
