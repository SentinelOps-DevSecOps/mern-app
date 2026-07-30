# ─────────────────────────────────────────────────
# STAGE 1: Builder
# Uses full Node image to install dependencies
# ─────────────────────────────────────────────────
FROM node:20-alpine AS builder

# Set working directory inside container
WORKDIR /app

# Copy package files FIRST
# Docker caches this layer — if package.json unchanged,
# it won't re-run npm install on next build (faster!)
COPY package*.json ./

# Install ONLY production dependencies
# --omit=dev skips devDependencies (nodemon, etc.)
RUN npm ci --omit=dev

# ─────────────────────────────────────────────────
# STAGE 2: Production Image
# Smaller final image — only what's needed to RUN
# ─────────────────────────────────────────────────
FROM node:20-alpine

# Security: create a non-root user
# Never run apps as root in containers!
RUN addgroup -g 1001 -S appgroup && \
    adduser  -u 1001 -S appuser -G appgroup

WORKDIR /app

# Copy node_modules from builder stage
COPY --from=builder /app/node_modules ./node_modules

# Copy source code, owned by appuser (not root)
COPY --chown=appuser:appgroup . .

# Switch to non-root user
USER appuser

# Document which port the app uses
EXPOSE 5000

# Health check — Docker monitors this endpoint
# If /health returns non-200, container is "unhealthy"
HEALTHCHECK --interval=30s \
            --timeout=10s \
            --start-period=10s \
            --retries=3 \
  CMD wget -qO- http://localhost:5000/health || exit 1

# Start the application
CMD ["node", "index.js"]

