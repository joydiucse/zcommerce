# syntax=docker/dockerfile:1

# ==========================================
# 1. Production dependencies
# ==========================================
FROM node:22-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force


# ==========================================
# 2. Runtime
# ==========================================
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production \
    PORT=4200 \
    HOST=0.0.0.0

# Non-root user (node:alpine already ships "node" uid/gid 1000)
COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package.json knexfile.js ./
COPY --chown=node:node src ./src

# Writable dirs for uploads and file logs (mounted as volumes in compose)
RUN mkdir -p storage/uploads logs && chown -R node:node storage logs

USER node

EXPOSE 4200

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD wget -qO- "http://127.0.0.1:${PORT}/health" >/dev/null || exit 1

# Run node directly (not via npm) so SIGTERM reaches the process
CMD ["node", "src/server.js"]
