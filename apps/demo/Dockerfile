FROM node:22.22.2-bookworm-slim AS build

WORKDIR /workspace

COPY package.json package-lock.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/admin/package.json apps/admin/package.json
COPY apps/demo/package.json apps/demo/package.json
COPY packages/js-sdk/package.json packages/js-sdk/package.json
COPY tsconfig.base.json ./
COPY packages/js-sdk/tsconfig.json packages/js-sdk/tsconfig.json
COPY packages/js-sdk/src packages/js-sdk/src

RUN npm ci --ignore-scripts

COPY . .

ARG VITE_API_BASE_URL=http://localhost:3000/v1
ARG VITE_ENVIRONMENT_KEY=production

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_ENVIRONMENT_KEY=$VITE_ENVIRONMENT_KEY

RUN npm run build --workspace=@ffp/js-sdk
RUN npm run build --workspace=@ffp/demo

FROM nginx:1.27-alpine

COPY --from=build /workspace/apps/demo/dist /usr/share/nginx/html

EXPOSE 80
