# Whole-monorepo build, matching apps/api/Dockerfile's approach. Build with
# `docker build -f apps/web/Dockerfile .` (repo root as context) — this is
# what docker-compose.yml does. Not exercised against a live Docker daemon
# in this environment; verify in your own setup (see README "Known
# limitations").
FROM node:20-alpine AS build
WORKDIR /repo

ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

COPY package.json package-lock.json* ./
COPY packages ./packages
COPY apps/web ./apps/web

RUN npm install --workspaces --if-present --include-workspace-root
RUN npm run build --workspace packages/config \
 && npm run build --workspace packages/shared \
 && npm run build --workspace apps/web

EXPOSE 3000
WORKDIR /repo/apps/web
CMD ["npx", "next", "start", "-p", "3000"]
