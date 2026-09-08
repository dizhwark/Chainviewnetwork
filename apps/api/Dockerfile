# Simple, whole-monorepo build. Not the smallest possible image, but avoids
# fragile manual node_modules surgery across npm workspaces — this Dockerfile
# has not been exercised against a live Docker daemon in this environment,
# so treat it as a documented starting point and verify it in your own
# Docker setup before relying on it for production (see README "Known
# limitations").
FROM node:20-alpine AS build
WORKDIR /repo

COPY package.json package-lock.json* ./
COPY packages ./packages
COPY apps/api ./apps/api

RUN npm install --workspaces --if-present --include-workspace-root
RUN npm run build --workspace packages/config \
 && npm run build --workspace packages/shared \
 && npm run prisma:generate --workspace apps/api \
 && npm run build --workspace apps/api

EXPOSE 4000
WORKDIR /repo/apps/api
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]
