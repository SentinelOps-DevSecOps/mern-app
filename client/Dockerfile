# ─────────────────────────────────────────────────
# STAGE 1: Build React App
# ─────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=${REACT_APP_API_URL}
ENV DISABLE_ESLINT_PLUGIN=true

# Copy all source code
COPY . .

# Build optimized production bundle
# Creates /app/build/ with static HTML/CSS/JS
RUN npm run build

# ─────────────────────────────────────────────────
# STAGE 2: Serve with Nginx
# Nginx is much lighter than Node for serving
# static files — only ~20MB vs ~180MB
# ─────────────────────────────────────────────────
FROM nginx:1.25-alpine

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built React files from builder stage
COPY --from=builder /app/build /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]


