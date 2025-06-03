# Use Node.js LTS version with Alpine for smaller image size
FROM node:20-alpine AS base

# Install pnpm globally
RUN corepack enable && corepack prepare pnpm@latest --activate

# Install dependencies only when needed
FROM base AS deps
# Install system dependencies
RUN apk add --no-cache libc6-compat curl python3 make g++
WORKDIR /app

# Ensure pnpm is available
RUN corepack enable && pnpm --version

# Install dependencies based on the preferred package manager
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile --prod=false

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
# Install build dependencies
RUN apk add --no-cache python3 make g++
# Ensure pnpm is available
RUN corepack enable && pnpm --version
# Copy package files
COPY package.json pnpm-lock.yaml* ./
# Install dependencies
RUN pnpm install --frozen-lockfile
# Copy application code
COPY . .

# Environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production \
    NEXT_SHARP_PATH=/tmp/node_modules/sharp

# Install sharp for image optimization
RUN pnpm add sharp

# Build the application with production optimizations
RUN pnpm build && pnpm prune --prod

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

# Install production dependencies
RUN apk add --no-cache curl

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