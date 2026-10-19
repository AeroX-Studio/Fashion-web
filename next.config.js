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
    // sql.js resolves its WebAssembly binary at runtime, which output tracing
    // cannot infer from the package's dynamic locateFile() call.
    outputFileTracingIncludes: {
      '/*': ['./node_modules/sql.js/dist/sql-wasm.wasm'],
    },
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

