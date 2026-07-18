# Build the whole site (homepage + /play/ + /classic/) with bun, serve with nginx.
FROM oven/bun:1 AS build
WORKDIR /app
COPY package.json bun.lock ./
COPY legacy/package.json legacy/
COPY remaster/package.json remaster/
RUN bun install --frozen-lockfile
COPY . .
ARG VITE_SITE_URL=https://bubbles.3m4.net
ENV VITE_SITE_URL=$VITE_SITE_URL
RUN bun run build

FROM nginx:alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
