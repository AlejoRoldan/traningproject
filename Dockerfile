# Multi-stage build for full-stack application
# Stage 1: Builder
# Rebuild trigger - fixing pnpm lockfile issues
FROM node:22.13.0-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN npm install -g pnpm@10.4.1
RUN pnpm install --frozen-lockfile

# Copy all source code
COPY tsconfig.json vite.config.ts next.config.ts ./
COPY client ./client
COPY server ./server
COPY shared ./shared
COPY prisma ./prisma

# Build both frontend and backend
RUN pnpm run build

# Stage 2: Runtime
FROM node:22.13.0-alpine

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache curl dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Copy built application from builder
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json

# Switch to non-root user
USER nodejs

# Expose port (Railway uses PORT env var, default 3001 for tRPC)
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["/usr/sbin/dumb-init", "--"]

# Start application
CMD ["node", "--experimental-specifier-resolution=node", "dist/index.js"]
