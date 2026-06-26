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
ARG VITE_DEFAULT_PROJECT_KEY=demo-project
ARG VITE_DEFAULT_FLAG_KEY=new-checkout
ARG VITE_DEMO_ADMIN_TOKEN
ARG VITE_DEMO_DEVELOPER_TOKEN
ARG VITE_DEMO_VIEWER_TOKEN

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_DEFAULT_PROJECT_KEY=$VITE_DEFAULT_PROJECT_KEY
ENV VITE_DEFAULT_FLAG_KEY=$VITE_DEFAULT_FLAG_KEY
ENV VITE_DEMO_ADMIN_TOKEN=$VITE_DEMO_ADMIN_TOKEN
ENV VITE_DEMO_DEVELOPER_TOKEN=$VITE_DEMO_DEVELOPER_TOKEN
ENV VITE_DEMO_VIEWER_TOKEN=$VITE_DEMO_VIEWER_TOKEN

RUN npm run build --workspace=@ffp/admin

FROM nginx:1.27-alpine

COPY --from=build /workspace/apps/admin/dist /usr/share/nginx/html

EXPOSE 80
