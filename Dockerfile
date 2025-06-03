# Use Node.js LTS version with Debian for better compatibility
FROM node:20-slim AS base

# Install pnpm and required system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    python3 \
    pkg-config \
    libvips-dev \
    && rm -rf /var/lib/apt/lists/* \
    && corepack enable \
    && corepack prepare pnpm@latest --activate

# Set environment variables for Sharp
ENV SHARP_IGNORE_GLOBAL_LIBVIPS=1

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files first for better layer caching
COPY package.json pnpm-lock.yaml* ./

# Install dependencies with frozen lockfile
RUN pnpm install --frozen-lockfile --prod=false

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Copy package files and installed dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production \
    NEXT_SHARP_PATH=/tmp/node_modules/sharp \
    NODE_OPTIONS=--openssl-legacy-provider

# Install sharp with specific platform and build the application
RUN pnpm add --ignore-scripts sharp \
    && pnpm add --save-optional --ignore-scripts sharp@latest \
    && pnpm rebuild --verbose sharp \
    && pnpm build \
    && pnpm prune --prod

# Production image, copy all the files and run next
FROM node:20-slim AS runner
WORKDIR /app

# Install production dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    NODE_OPTIONS='--max_old_space_size=2048'

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    mkdir -p /app/.next/cache /app/.next/standalone /app/.next/static && \
    chown -R nextjs:nodejs /app/.next

# Ensure pnpm is available
RUN corepack enable

# Copy necessary files from builder
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Expose the port the app runs on
EXPOSE 3000

# Set the command to start the application
USER nextjs

# Set the command to start the server
CMD ["node", "server.js"] 