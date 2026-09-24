FROM node:18-alpine

RUN npm install -g pnpm
RUN apk add --no-cache openssl

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/platform/package.json ./packages/platform/
RUN pnpm install --frozen-lockfile

COPY packages/platform/ ./packages/platform/
RUN cd packages/platform && pnpm prisma generate

EXPOSE 3001
CMD ["node", "packages/platform/src/index.js"]