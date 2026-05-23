# Build aşaması: Vite ile frontend build
FROM node:20-alpine AS builder

ENV TZ=Europe/Istanbul
RUN apk add --no-cache tzdata \
  && cp /usr/share/zoneinfo/$TZ /etc/localtime \
  && echo "$TZ" > /etc/timezone

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .
RUN yarn build

# Production aşaması: Express API + statik dosyalar
FROM node:20-alpine AS runner

ENV TZ=Europe/Istanbul
RUN apk add --no-cache tzdata \
  && cp /usr/share/zoneinfo/$TZ /etc/localtime \
  && echo "$TZ" > /etc/timezone

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8102

# Sadece production bağımlılıkları
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production

# Build çıktısı ve API için gerekli dosyalar
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.js ./
COPY --from=builder /app/js ./js
COPY --from=builder /app/legal-dictionary.json ./

EXPOSE 8102

CMD ["node", "server.js"]
