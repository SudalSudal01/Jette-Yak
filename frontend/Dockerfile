# Multi-stage build for React Vite SPA
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Nginx 런타임
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# 기본 파일 삭제 및 빌드 결과 복사
RUN rm -rf ./*
COPY --from=builder /app/dist ./
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80 443
CMD ["nginx", "-g", "daemon off;"]
