FROM node:20-alpine

RUN apk add --no-cache python3 make g++ linux-headers && \
    npm install -g pnpm --registry=https://registry.npmmirror.com

WORKDIR /app

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --prod --registry=https://registry.npmmirror.com && \
    apk del python3 make g++

COPY src/ ./src/

RUN mkdir -p /app/data

EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001
ENV DB_PATH=/app/data/slimming.db

CMD ["node", "src/index.js"]