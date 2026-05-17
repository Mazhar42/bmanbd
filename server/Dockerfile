FROM node:20-bookworm-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

RUN mkdir -p /app/uploads

COPY src ./src

EXPOSE 5000

CMD ["node", "src/server.js"]
