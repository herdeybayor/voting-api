# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Install build dependencies for bcrypt
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install dependencies with clean cache
RUN npm ci && npm cache clean --force

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build application
RUN npm run build

# Remove development dependencies
RUN npm prune --production

# Stage 3: Runtime
FROM node:20-alpine AS runner
WORKDIR /app

# Set NODE_ENV to production
ENV NODE_ENV=production

# Copy built application and production dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/drizzle ./drizzle

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs && \
    chown -R nestjs:nodejs /app
USER nestjs

# Expose application port
EXPOSE 4000

# Start application
CMD ["node", "dist/src/main"]
