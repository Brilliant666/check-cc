# syntax=docker/dockerfile:1

# Build the static export, then serve it with Nginx.
FROM node:22-bookworm-slim AS builder

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm install -g pnpm@9.15.9

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

COPY . .

ARG NEXT_PUBLIC_SITE_URL=""
ARG NEXT_PUBLIC_REPO_URL="https://github.com/Brilliant666/check-cc"
ARG NEXT_PUBLIC_IP_INTEL_ENABLED="true"
ARG NEXT_PUBLIC_IP_INTEL_ENDPOINT="https://ipwho.is/"
ARG NEXT_PUBLIC_IP_INTEL_FALLBACK_ENDPOINT="https://ipapi.co/json/"
ARG NEXT_PUBLIC_WEBRTC_STUN_URL="stun:stun.cloudflare.com:3478"

ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL} \
    NEXT_PUBLIC_REPO_URL=${NEXT_PUBLIC_REPO_URL} \
    NEXT_PUBLIC_IP_INTEL_ENABLED=${NEXT_PUBLIC_IP_INTEL_ENABLED} \
    NEXT_PUBLIC_IP_INTEL_ENDPOINT=${NEXT_PUBLIC_IP_INTEL_ENDPOINT} \
    NEXT_PUBLIC_IP_INTEL_FALLBACK_ENDPOINT=${NEXT_PUBLIC_IP_INTEL_FALLBACK_ENDPOINT} \
    NEXT_PUBLIC_WEBRTC_STUN_URL=${NEXT_PUBLIC_WEBRTC_STUN_URL}

RUN pnpm build

FROM nginx:stable-alpine AS runner

COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/out /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/healthz >/dev/null || exit 1
