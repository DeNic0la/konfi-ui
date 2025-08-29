FROM node:20.13.1-alpine3.19 AS build
RUN npm i -g pnpm@8.5.1
WORKDIR /app/src
ENV NX_DAEMON=false
COPY package*.json ./
COPY pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . ./
RUN pnpm exec nx run konfi-ui:build:production

FROM node:20.13.1-alpine3.19
COPY --from=build /dist/apps/konfi-ui ./usr/app
RUN addgroup -S angulargroup && adduser -S angular -G angulargroup
USER angular
WORKDIR /usr/app
CMD ["node", "server/server.mjs"]
EXPOSE 4000
