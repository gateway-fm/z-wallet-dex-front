FROM node:18-slim AS production

# Install packages and create user
RUN apt-get update && apt-get install -y tzdata && \
    groupadd -g 1001 nodejs && \
    useradd -m -u 1001 -g nodejs appuser && \
    rm -rf /var/lib/apt/lists/*

# Use Yarn 1.22
RUN npm install -g --force yarn@1.22.0

WORKDIR /app

# Copy package files, built app, and node_modules
COPY package.json ./
COPY build ./build
COPY node_modules ./node_modules

# Install only prod deps
# NOTE: это дерьмо не ставится
# RUN yarn install --production

# Simple health check endpoint script
RUN echo 'const http = require("http"); \
http.get("http://localhost:3000/", (res) => { \
  process.exit(res.statusCode === 200 ? 0 : 1); \
}).on("error", () => process.exit(1));' > health-check.js

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node health-check.js

CMD ["npm", "run", "serve"]

