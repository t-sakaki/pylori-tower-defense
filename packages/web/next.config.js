/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    unoptimized: true,
  },
  output: 'export',
  transpilePackages: ['@pylori/shared'],
};

module.exports = nextConfig;