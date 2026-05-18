# Stage 1 — build the Vite app
FROM node:22-slim AS builder
 
RUN corepack enable && corepack prepare pnpm@latest --activate
 
WORKDIR /app
 
COPY package.json pnpm-lock.yaml* .npmrc* ./
 
# Allow build scripts for esbuild and tailwindcss
RUN pnpm install --no-frozen-lockfile --config.allow-build=esbuild --config.allow-build=@tailwindcss/oxide
 
ARG VITE_API_URL
ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
 
COPY . .
RUN pnpm run build
 
# Stage 2 — serve with nginx
FROM nginx:alpine
 
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
 
EXPOSE 80
 
CMD ["nginx", "-g", "daemon off;"]
 