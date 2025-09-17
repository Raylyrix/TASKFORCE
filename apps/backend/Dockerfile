# Multi-stage build for production
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build shared package
RUN pnpm --filter @taskforce/shared build

# Build backend
RUN pnpm --filter @taskforce/backend build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 backend

# Copy built application
COPY --from=builder --chown=backend:nodejs /app/apps/backend/dist ./dist
COPY --from=builder --chown=backend:nodejs /app/apps/backend/package.json ./package.json
COPY --from=builder --chown=backend:nodejs /app/node_modules ./node_modules

USER backend

EXPOSE 4000

ENV PORT=4000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "dist/apps/backend/src/index.js"]
