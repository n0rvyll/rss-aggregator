/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true, // ⬅️ a Next nem próbálja proxyn át lehúzni a képet
  },
};

export default nextConfig;