/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['next-sanity', 'sanity'],
  // Allow dev server access from other devices on local network
  allowedDevOrigins: ['localhost', '127.0.0.1', '192.168.1.158', '*.local'],
};

export default nextConfig;
