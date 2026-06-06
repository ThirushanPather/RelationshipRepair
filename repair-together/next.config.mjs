/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove the X-Powered-By header
  poweredByHeader: false,
  experimental: {
    // Disable client-side Router Cache for dynamic pages so navigating to
    // server-component pages (home, progress) always fetches fresh data.
    // Without this, Next.js caches RSC payloads for 30s even when force-dynamic
    // is set, causing stale progress bars and recent activity after saves.
    staleTimes: {
      dynamic: 0,
    },
  },
}

export default nextConfig
