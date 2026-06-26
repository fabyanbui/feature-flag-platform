FROM node:22.22.2-bookworm-slim AS dependencies

WORKDIR /workspace

RUN apt-get update \
    && apt-get install --yes --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/admin/package.json apps/admin/package.json
COPY apps/demo/package.json apps/demo/package.json
COPY packages/js-sdk/package.json packages/js-sdk/package.json
COPY tsconfig.base.json ./
COPY packages/js-sdk/tsconfig.json packages/js-sdk/tsconfig.json
COPY packages/js-sdk/src packages/js-sdk/src

RUN npm ci --ignore-scripts

FROM dependencies AS build

COPY . .

# Prisma configuration requires a URL while generating the client, but client
# generation does not connect to this build-only placeholder database.
RUN DATABASE_URL=postgresql://build:build@localhost:5432/build \
    npm run prisma:generate --workspace=@ffp/backend
RUN npm run build --workspace=@ffp/backend

FROM node:22.22.2-bookworm-slim AS runtime

WORKDIR /workspace

RUN apt-get update \
    && apt-get install --yes --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV API_PORT=3000

COPY --from=build /workspace/package.json ./package.json
COPY --from=build /workspace/package-lock.json ./package-lock.json
COPY --from=build /workspace/tsconfig.base.json ./tsconfig.base.json
COPY --from=build /workspace/node_modules ./node_modules
COPY --from=build /workspace/apps/backend/package.json ./apps/backend/package.json
COPY --from=build /workspace/apps/backend/tsconfig.json ./apps/backend/tsconfig.json
COPY --from=build /workspace/apps/backend/prisma.config.ts ./apps/backend/prisma.config.ts
COPY --from=build /workspace/apps/backend/prisma ./apps/backend/prisma
COPY --from=build /workspace/apps/backend/dist ./apps/backend/dist

USER node

EXPOSE 3000

CMD ["node", "apps/backend/dist/src/main.js"]
