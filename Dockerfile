# Railover AppX — Multi-stage Docker build
# Build context must be preview-server/ (parent dir) to access both frontend and backend
# docker build -t railover:appx -f railover/Dockerfile .

# ── Stage 1: Build frontend ──────────────────────────────────────
FROM node:18-alpine AS frontend-builder

WORKDIR /frontend
COPY railoover-frontend/package*.json ./
RUN npm ci --legacy-peer-deps
COPY railoover-frontend/ .
ENV NODE_OPTIONS=--openssl-legacy-provider
RUN npm run build

# ── Stage 2: Build backend ───────────────────────────────────────
FROM node:18-alpine AS backend-builder

WORKDIR /app
COPY railover/package*.json ./
RUN npm ci
COPY railover/ .
RUN npx tsc && echo "Backend build successful"

# ── Stage 3: Production image ────────────────────────────────────
FROM node:18-alpine AS production

RUN apk update && apk add --no-cache git openssh-client openssl && rm -rf /var/cache/apk/*

WORKDIR /usr/src/app

COPY railover/package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Backend compiled output
COPY --from=backend-builder /app/built/ ./built/

# Frontend build → public/
COPY --from=frontend-builder /frontend/build/ ./public/

# Templates and Docker config
COPY railover/template/ ./template/
COPY railover/dockerfiles/ ./dockerfiles/
COPY railover/currentdirectory ./

ENV NODE_ENV=production \
    PORT=3000 \
    ACCEPTED_TERMS=true

EXPOSE 3000 80 443

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget --no-verbose --tries=1 -O /dev/null http://localhost:3000/checkhealth || exit 1

CMD ["node", "built/server.js"]
