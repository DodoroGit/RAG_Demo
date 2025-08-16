# Build
FROM node:20 as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Serve 靜態檔
FROM nginx:1.27-alpine
COPY --from=build /app/build /usr/share/nginx/html
# 讓前端路由回退
RUN printf "server { \
  listen 8081; \
  server_name _; \
  root /usr/share/nginx/html; \
  index index.html; \
  location / { try_files \$uri /index.html; } \
}\n" > /etc/nginx/conf.d/default.conf
