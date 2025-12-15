/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
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
    // Allow serving images from media-storage directory
    unoptimized: true,
  },
  // FIX #5: Configure static file serving for media storage
  staticPageGenerationTimeout: 0,
  // Disable static optimization for API routes
  generateBuildId: async () => {
    return 'build-' + Date.now()
  },
  webpack: (config, { isServer }) => {
    // Handle ChromaDB's external dependencies
    config.resolve.alias = {
      ...config.resolve.alias,
      'chromadb-default-embed': false,
    };

    // Ignore specific modules that aren't needed
    config.externals = [
      ...(config.externals || []),
      'chromadb-default-embed',
    ];

    // For server-side, externalize native dependencies to avoid bundling issues
    if (isServer) {
      config.externals.push('chromadb');
      config.externals.push('sharp');
    }

    // Handle transformers.js WASM files
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    };

    return config;
  },
  // Experimental features to help with external packages
  experimental: {
    // Externalize packages with native bindings that need to be loaded at runtime
    serverComponentsExternalPackages: ['chromadb', 'sharp'],
  },
}

module.exports = nextConfig
