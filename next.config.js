/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/data/images/:path*',
        destination: '/api/images/:path*',
      },
    ];
  },
  experimental: {
    serverComponentsExternalPackages: ['sql.js', 'bcryptjs'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), 'sql.js'];
    }
    return config;
  },
};

module.exports = nextConfig;

