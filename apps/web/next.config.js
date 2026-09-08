/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@maybe/shared", "@maybe/config"],
};

module.exports = nextConfig;
