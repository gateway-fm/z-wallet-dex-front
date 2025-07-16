# 1) Build Stage
FROM node:20.18 AS builder
WORKDIR /source

# Copy package manifests
COPY ./scripts/ /source/scripts/
COPY ./src/ /source/src/
COPY ./lingui.config.ts /source/lingui.config.ts
COPY ./package.json /source/package.json
COPY ./yarn.lock /source/yarn.lock

# Install dependencies (no --frozen-lockfile)
RUN yarn install

# Copy app source & build
COPY . .
RUN yarn prepare && yarn build

# 2) Production Stage
FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

