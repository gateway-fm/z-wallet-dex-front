FROM nginx:alpine AS production

# Install packages and create user
RUN apk add --no-cache tzdata && \
    addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001

# Copy built application and config
COPY build /usr/share/nginx/html
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# Set proper permissions
RUN chown -R appuser:nodejs /usr/share/nginx/html && \
 chown -R appuser:nodejs /var/cache/nginx && \
 chown -R appuser:nodejs /var/log/nginx && \
 chown -R appuser:nodejs /etc/nginx/conf.d && \
 touch /var/run/nginx.pid && \
 chown -R appuser:nodejs /var/run/nginx.pid

USER appuser

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
 CMD wget --no-verbose --tries=1 --spider http://localhost:80/health || exit 1

CMD ["nginx", "-g", "daemon off;"]

