/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Pin the project root so lockfiles in parent folders are not mistaken for a workspace.
  outputFileTracingRoot: __dirname,
};

module.exports = nextConfig;
