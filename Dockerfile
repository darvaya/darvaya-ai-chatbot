# Build stage with all dependencies
FROM node:20-slim AS builder
WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    pkg-config \
    libvips-dev \
    && rm -rf /var/lib/apt/lists/*

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install all dependencies including devDependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
ENV NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production \
    NODE_OPTIONS=--openssl-legacy-provider

# Install sharp with specific version and build
RUN pnpm add sharp@0.33.2 \
    && pnpm build \
    && pnpm prune --prod

# Production stage
FROM node:20-slim AS runner
WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    libvips-dev \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    NODE_OPTIONS='--max_old_space_size=2048'

# Create a non-root user and set up directories
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    mkdir -p /app/.next/cache /app/.next/standalone /app/.next/static && \
    chown -R nextjs:nodejs /app/.next

# Ensure pnpm is available
RUN corepack enable

# Copy necessary files from builder with proper permissions
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

# Start the application
CMD ["node", "server.js"] 