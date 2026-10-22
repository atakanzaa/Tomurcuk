# syntax=docker/dockerfile:1
# Build bağlamı repo kökü: web/ design/ klasöründeki tokenları ve bileşen stillerini içe aktarır.
#   docker build -f web/Dockerfile .
# Image ortamdan bağımsızdır; API adresi çalışırken TOMURCUK_API_URL ile verilir.

FROM node:22-alpine AS build
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable
WORKDIR /src/web
COPY web/package.json web/pnpm-lock.yaml web/pnpm-workspace.yaml ./
RUN --mount=type=cache,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile
COPY design /src/design
COPY web ./
RUN pnpm build

FROM node:22-alpine
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
WORKDIR /app
# Standalone çıktı repo kökünü izler (outputFileTracingRoot); sunucu web/server.js'te.
COPY --from=build --chown=node:node /src/web/.next/standalone ./
COPY --from=build --chown=node:node /src/web/.next/static ./web/.next/static
USER node
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=5s --start-period=20s --retries=6 \
  CMD wget -qO- http://127.0.0.1:3000/api/saglik > /dev/null || exit 1
CMD ["node", "web/server.js"]
