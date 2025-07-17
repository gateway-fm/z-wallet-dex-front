FROM node:18-alpine AS production

# Install packages and create user
RUN apk add --no-cache tzdata && \
    addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001 -G nodejs

WORKDIR /app

# Copy package files and application
COPY package.json package-lock.json ./
COPY build ./build

# Install only prod dependencies
RUN npm ci --only=production && npm cache clean --force

# Simple health check endpoint script
RUN echo 'const http = require("http"); \
http.get("http://localhost:3000/", (res) => { \
  process.exit(res.statusCode === 200 ? 0 : 1); \
}).on("error", () => process.exit(1));' > health-check.js

RUN chown -R appuser:nodejs /app

USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node health-check.js

CMD ["npm", "run", "serve"]

