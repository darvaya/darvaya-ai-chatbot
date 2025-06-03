# Build stage
FROM node:20-slim AS builder
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    pkg-config \
    libvips-dev \
    libglib2.0-0 \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    curl \
    procps \
    && rm -rf /var/lib/apt/lists/*

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set environment variables
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_OPTIONS="--max_old_space_size=4096" \
    SHARP_IGNORE_GLOBAL_LIBVIPS=1 \
    npm_config_platform=linux \
    npm_config_arch=x64

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Debug: Show package.json content
RUN echo "=== Package.json content ===" && \
    cat package.json && \
    echo "=== Installing dependencies ===" && \
    pnpm install --frozen-lockfile --verbose

# Copy source code
COPY . .

# Debug: Show project structure and verify files
RUN echo "=== Project structure ===" && \
    ls -la && \
    echo "=== Next.js config (if exists) ===" && \
    (cat next.config.js 2>/dev/null || cat next.config.mjs 2>/dev/null || echo "No next.config found") && \
    echo "=== TypeScript config (if exists) ===" && \
    (cat tsconfig.json 2>/dev/null || echo "No tsconfig.json found") && \
    echo "=== Environment check ===" && \
    echo "Node: $(node --version)" && \
    echo "pnpm: $(pnpm --version)" && \
    echo "Memory: $(free -h | grep Mem)" && \
    echo "Disk space: $(df -h /app)"

# Attempt build with error handling
RUN echo "=== Attempting Next.js build ===" && \
    (pnpm run build --verbose 2>&1 || \
    (echo "=== Build failed, trying alternatives ===" && \
     echo "Checking for lint errors..." && \
     (pnpm run lint --fix 2>/dev/null || true) && \
     echo "Trying build without optimization..." && \
     NEXT_BUILD_OPTIMIZATION=false pnpm run build 2>&1)) && \
    echo "=== Build completed successfully ==="

# Production stage
FROM node:20-slim AS runner
WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    libvips42 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set production environment
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    NODE_OPTIONS="--max_old_space_size=2048"

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Enable pnpm
RUN corepack enable

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

# Install production dependencies
RUN pnpm install --prod --frozen-lockfile && pnpm store prune

# Create cache directory
RUN mkdir -p .next/cache && chown -R nextjs:nodejs .next

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

EXPOSE 3000
USER nextjs
CMD ["node", "server.js"]
