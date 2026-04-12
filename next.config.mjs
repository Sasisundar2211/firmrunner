/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js 14's built-in lint runner uses removed ESLint 9 options (useEslintrc, extensions).
  // ESLint runs via `npm run lint` instead, using eslint.config.mjs (flat config).
  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default nextConfig
