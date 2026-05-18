# Stage 1 — build the Vite app
FROM node:22-slim AS builder

WORKDIR /app

# Use npm for the Docker build to avoid pnpm build script restrictions
COPY package.json ./

# Install dependencies with npm (no lockfile restrictions)
RUN npm install --legacy-peer-deps

ARG VITE_API_URL
ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

COPY . .
RUN npm run build

# Stage 2 — serve with nginx
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]