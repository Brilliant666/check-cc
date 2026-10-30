# syntax=docker/dockerfile:1

# Build the static export, then serve it with Nginx.
# Base images are pinned by digest. Refresh with:
#   docker buildx imagetools inspect node:22-bookworm-slim
#   docker buildx imagetools inspect nginxinc/nginx-unprivileged:stable-alpine
FROM node:22-bookworm-slim@sha256:4b150b48b4116e2a22f2c39cc27025fbf4f153e2078fd3b14d159fdb5c7279da AS builder

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
ARG NEXT_PUBLIC_IP_INTEL_FALLBACK_ENDPOINT="https://get.geojs.io/v1/ip/geo.json,https://ipapi.co/json/"
ARG NEXT_PUBLIC_WEBRTC_STUN_URL="stun:stun.cloudflare.com:3478"
ARG NEXT_PUBLIC_IPV6_ENDPOINT="https://api6.ipify.org?format=json"

ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL} \
    NEXT_PUBLIC_REPO_URL=${NEXT_PUBLIC_REPO_URL} \
    NEXT_PUBLIC_IP_INTEL_ENABLED=${NEXT_PUBLIC_IP_INTEL_ENABLED} \
    NEXT_PUBLIC_IP_INTEL_ENDPOINT=${NEXT_PUBLIC_IP_INTEL_ENDPOINT} \
    NEXT_PUBLIC_IP_INTEL_FALLBACK_ENDPOINT=${NEXT_PUBLIC_IP_INTEL_FALLBACK_ENDPOINT} \
    NEXT_PUBLIC_WEBRTC_STUN_URL=${NEXT_PUBLIC_WEBRTC_STUN_URL} \
    NEXT_PUBLIC_IPV6_ENDPOINT=${NEXT_PUBLIC_IPV6_ENDPOINT}

RUN pnpm build \
 && node deploy/csp.mjs > /app/csp.conf

# Runs as the unprivileged nginx user (uid 101) and listens on 8080.
FROM nginxinc/nginx-unprivileged:stable-alpine@sha256:f5116ed4606f3eb015dd4a8e28cb9b351476dc0ad4bc6e9f93b19cec130cdf03 AS runner

COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/csp.conf /etc/nginx/snippets/csp.conf
COPY --from=builder /app/out /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/healthz >/dev/null || exit 1
