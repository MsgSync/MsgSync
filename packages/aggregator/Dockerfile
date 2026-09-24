FROM node:18-alpine

RUN npm install -g pnpm
RUN apk add --no-cache openssl

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/aggregator/package.json ./packages/aggregator/
COPY packages/sdk-js/package.json ./packages/sdk-js/
RUN pnpm install --frozen-lockfile

COPY packages/aggregator/ ./packages/aggregator/
COPY packages/sdk-js/ ./packages/sdk-js/
RUN cd packages/aggregator && pnpm prisma generate

EXPOSE 3000
CMD ["node", "packages/aggregator/src/index.js"]