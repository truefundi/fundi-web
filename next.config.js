/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const backend = (process.env.API_PROXY_TARGET || 'http://localhost:3000').replace(/\/$/, '');
    return { beforeFiles: [{ source: '/api/v1/:path*', destination: `${backend}/api/v1/:path*` }] };
  },
  // Pin the project root so lockfiles in parent folders are not mistaken for a workspace.
  outputFileTracingRoot: __dirname,
};

module.exports = nextConfig;
