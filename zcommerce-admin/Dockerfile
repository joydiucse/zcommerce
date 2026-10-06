# syntax=docker/dockerfile:1

# ==========================================
# 1. Build
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite inlines VITE_* at build time, so they must be build args (set in docker-compose.yml)
ARG VITE_API_URL
ARG VITE_STORE_URL
ENV VITE_API_URL=$VITE_API_URL \
    VITE_STORE_URL=$VITE_STORE_URL

RUN test -n "$VITE_API_URL" || (echo "VITE_API_URL build arg is required" && exit 1) \
    && npm run build


# ==========================================
# 2. Runtime
# ==========================================
FROM nginx:1.27-alpine AS runner

RUN rm -rf /usr/share/nginx/html/* /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://127.0.0.1/healthz >/dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
