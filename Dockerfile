FROM node:20-slim

RUN npm install -g pnpm

WORKDIR /app

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY lib/ ./lib/
COPY artifacts/api-server/ ./artifacts/api-server/

RUN pnpm install --frozen-lockfile

RUN pnpm --filter @workspace/api-server run build

WORKDIR /app/artifacts/api-server

ENV NODE_ENV=production

CMD ["node", "dist/index.cjs"]
