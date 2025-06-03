/** @type {import('next').NextConfig} */
const webpack = require("webpack");

// Add Node.js polyfills
const nodeExternals = require("webpack-node-externals");

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

  // Disable server components external packages that use Node.js modules
  experimental: {
    serverComponentsExternalPackages: ["@auth/drizzle-adapter"],
  },

  // Configure images
  images: {
    domains: ["avatars.githubusercontent.com", "lh3.googleusercontent.com"],
    unoptimized: true, // Disable default image optimization for now
  },

  // Environment variables for client-side
  env: {
    NEXT_PUBLIC_APP_URL:
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  },

  // Image optimization settings
  images: {
    domains: ["avatars.githubusercontent.com", "lh3.googleusercontent.com"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ["image/webp"],
    unoptimized: true, // Disable default image optimization for now
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
        source: "/:all*(svg|jpg|png|webp)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, must-revalidate",
          },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, must-revalidate",
          },
        ],
      },
    ];
  },

  // Enable React strict mode for better development
  reactStrictMode: true,

  // Disable x-powered-by header for security
  poweredByHeader: false,

  // Enable compression
  compress: true,

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
  experimental: {
    swcMinify: true,
  },

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
