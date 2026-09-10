FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN NODE_TLS_REJECT_UNAUTHORIZED=0 npm_config_strict_ssl=false npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
ENTRYPOINT ["nginx", "-g", "daemon off;"]