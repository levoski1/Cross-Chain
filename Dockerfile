FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --only=production

COPY tsconfig.json hardhat.config.ts ./
COPY contracts/ ./contracts/
COPY scripts/ ./scripts/
COPY test/ ./test/

RUN npm run build
RUN npm run generate:types

FROM node:20-alpine AS runner

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 hardhat

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/artifacts ./artifacts
COPY --from=builder /app/cache ./cache
COPY --from=builder /app/typechain-types ./typechain-types
COPY --from=builder /app/contracts ./contracts
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/hardhat.config.ts ./
COPY --from=builder /app/tsconfig.json ./
COPY --from=builder /app/package.json ./

USER hardhat

EXPOSE 8545

ENTRYPOINT ["npx", "hardhat"]

CMD ["node"]
