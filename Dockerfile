# Stage 1 — build the Vite app
FROM node:20-slim AS builder
 
WORKDIR /app
 
# Install dependencies
COPY package*.json ./
RUN npm ci
 
# Copy source and build
# VITE_API_URL is injected at build time via Railway build variables
ARG VITE_API_URL
ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
 
COPY . .
RUN npm run build
 
# Stage 2 — serve with nginx
FROM nginx:alpine
 
# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html
 
# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf
 
EXPOSE 80
 
CMD ["nginx", "-g", "daemon off;"]
 