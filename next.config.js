/** @type {import('next').NextConfig} */
const webpack = require("webpack");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure webpack to handle Node.js polyfills
  webpack: (config, { isServer }) => {
    // Add Node.js polyfills for client-side
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: require.resolve("crypto-browserify"),
        stream: require.resolve("stream-browserify"),
        url: require.resolve("url/"),
        zlib: require.resolve("browserify-zlib"),
        http: require.resolve("stream-http"),
        https: require.resolve("https-browserify"),
        assert: require.resolve("assert/"),
        os: require.resolve("os-browserify/browser"),
        path: require.resolve("path-browserify"),
        buffer: require.resolve("buffer/"),
        process: require.resolve("process/browser"),
        util: require.resolve("util/"),
        _stream_transform: require.resolve("stream-browserify"),
      };

      // Add plugins to provide global variables
      config.plugins.push(
        new webpack.ProvidePlugin({
          process: "process/browser",
          Buffer: ["buffer", "Buffer"],
        }),
      );
    }

    // Add rule for webpack 5 to handle Node.js polyfills
    config.resolve.alias = {
      ...config.resolve.alias,
      crypto: "crypto-browserify",
    };

    // Add rule to handle .node files
    config.module.rules.push({
      test: /\.node$/,
      use: "node-loader",
    });

    return config;
  },

  // Configure images
  images: {
    domains: ["avatars.githubusercontent.com", "lh3.googleusercontent.com"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ["image/webp"],
    unoptimized: false, // Enable image optimization
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },

  // Environment variables for client-side
  env: {
    NEXT_PUBLIC_APP_URL:
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  },

  // Cache headers for static assets
  async headers() {
    return [
      {
        source: "/:all*(svg|jpg|png|webp|ico|json|xml)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },

  // Enable React strict mode
  reactStrictMode: true,

  // Disable x-powered-by header for security
  poweredByHeader: false,

  // Enable compression
  compress: true,

  // Enable production browser source maps
  productionBrowserSourceMaps: true,

  // Enable static exports for static site generation
  output: "standalone",

  // Configure build output directory
  distDir: ".next",

  // Configure build ID
  generateBuildId: async () => {
    // Use the commit hash as the build ID
    if (process.env.RAILWAY_GIT_COMMIT_SHA) {
      return process.env.RAILWAY_GIT_COMMIT_SHA.substring(0, 12);
    }
    // Fallback to a timestamp for local development
    return `dev-${Date.now()}`;
  },

  // Configure redirects for cleaner URLs
  async redirects() {
    return [
      {
        source: "/home",
        destination: "/",
        permanent: true,
      },
    ];
  },

  // Configure rewrites for API endpoints
  async rewrites() {
    return {
      beforeFiles: [
        // Add API rewrites here if needed
      ],
    };
  },

  // Use SWC for compilation
  swcMinify: true,

  // Webpack configuration for optimizations
  webpack: (config, { dev, isServer }) => {
    // Optimize CSS
    if (!dev && !isServer) {
      config.optimization.splitChunks.cacheGroups = {
        ...config.optimization.splitChunks.cacheGroups,
        styles: {
          name: "styles",
          test: /\.(css|scss)$/,
          chunks: "all",
          enforce: true,
        },
      };
    }

    // Webpack configuration for Node.js polyfills
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: require.resolve("crypto-browserify"),
        stream: require.resolve("stream-browserify"),
        url: require.resolve("url"),
        zlib: require.resolve("browserify-zlib"),
        http: require.resolve("stream-http"),
        https: require.resolve("https-browserify"),
        assert: require.resolve("assert"),
        os: require.resolve("os-browserify/browser"),
        path: require.resolve("path-browserify"),
        buffer: require.resolve("buffer/"),
        process: require.resolve("process/browser"),
        util: require.resolve("util/"),
        _stream_transform: require.resolve("stream-browserify"),
      };

      // Add plugin to provide global variables
      config.plugins.push(
        new webpack.ProvidePlugin({
          process: "process/browser",
          Buffer: ["buffer", "Buffer"],
        }),
      );
    }

    return config;
  },
};

module.exports = nextConfig;
