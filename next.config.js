/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  distDir: '.next-dev',
  // Disable output tracing files to avoid trace write issues on Windows
  outputFileTracing: false,
};

module.exports = nextConfig;
