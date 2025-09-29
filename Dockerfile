# Multi-stage build for React app
FROM node:20-slim AS builder

# Use Yarn 1.22
RUN npm install -g --force yarn@1.22.22

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json yarn.lock* ./

# Install deps and build
RUN yarn install --frozen-lockfile --ignore-scripts

COPY . .
RUN yarn prepare
RUN yarn build

# Remove dev dependencies and keep only production ones
RUN yarn install --production --frozen-lockfile --ignore-scripts
RUN yarn add serve --ignore-scripts --force

# Production stage
FROM node:20-slim AS production

# Install packages and create user
RUN apt-get update && apt-get install -y tzdata && \
    groupadd -g 1001 nodejs && \
    useradd -m -u 1001 -g nodejs appuser && \
    rm -rf /var/lib/apt/lists/*

# Use Yarn 1.22
RUN npm install -g --force yarn@1.22.22

WORKDIR /app

# Copy built application
COPY --chown=appuser:nodejs package.json ./
COPY --from=builder --chown=appuser:nodejs /app/build ./build
COPY --from=builder --chown=appuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:nodejs /app/public ./public
COPY --from=builder --chown=appuser:nodejs /app/scripts/generate-runtime-config.sh ./scripts/

# Create simple health check endpoint script
RUN echo 'const http = require("http"); \
http.get("http://localhost:3000/", (res) => { \
  process.exit(res.statusCode === 200 ? 0 : 1); \
}).on("error", () => process.exit(1));' > health-check.js && \
  chown appuser:nodejs health-check.js

# Make runtime config script executable
RUN chmod +x ./scripts/generate-runtime-config.sh

# Switch to non-root user
USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node health-check.js

# Generate runtime configuration and start the application
CMD ["sh", "-c", "./scripts/generate-runtime-config.sh && yarn serve"]

