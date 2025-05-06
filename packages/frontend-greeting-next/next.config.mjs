/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  reactStrictMode: true,
  transpilePackages: ['@mysten/dapp-kit'],
  experimental: {
    // Required for SUI Wallet Standard integration
    externalDir: true,
  },
}

export default nextConfig 