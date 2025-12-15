FROM node:20-slim AS base

# Install pnpm and required libraries
# - openssl: Prisma requirement
# - ca-certificates: HTTPS downloads
# - build-essential, python3: native builds (sharp)
# - libvips: for sharp image processing
RUN npm install -g pnpm && \
        apt-get update && \
        apt-get install -y --no-install-recommends \
            openssl \
            ca-certificates \
            build-essential \
            python3 \
            libvips && \
        rm -rf /var/lib/apt/lists/*

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./
# Install dependencies
RUN pnpm install --frozen-lockfile && \
    pnpm approve-builds sharp

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN pnpm prisma generate

# Build the application
# NOTE: With `export const dynamic = 'force-dynamic'` in API routes,
# Next.js will NOT try to execute them during build
RUN pnpm build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
# Copy Prisma schema
COPY --from=builder /app/prisma ./prisma
# Copy the entire node_modules to get Prisma binaries + transformers.js models cache
COPY --from=builder /app/node_modules ./node_modules
# Copy custom server for media-storage
COPY server.js ./server.js

# Create media-storage directory for cover images
RUN mkdir -p /app/media-storage/covers && chown -R nextjs:nodejs /app/media-storage

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
