# ==============================================================================
# STAGE 1: BUILD
# ==============================================================================
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies first (better Docker caching)
COPY package.json package-lock.json* ./
RUN npm install

# Copy source and build static assets
COPY . .
RUN npm run build

# ==============================================================================
# STAGE 2: WEB SERVER RUNTIME
# ==============================================================================
FROM nginx:alpine

# Copy built assets to Nginx html directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
