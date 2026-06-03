# Stage 1: Build the frontend
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Setup the production backend server
FROM node:20-alpine

WORKDIR /app
# We only need the built frontend, the server code, and the server's package.json
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server/package*.json ./server/

WORKDIR /app/server
RUN npm ci --only=production

COPY --from=builder /app/server ./
RUN chmod +x ./entrypoint.sh

# Setup data directory for JSON state
RUN mkdir -p /app/server/data
ENV TOME_DATA_DIR=/app/server/data

# Fly.io routes public traffic to PORT (5050).
EXPOSE 5050
ENV PORT=5050
ENV NODE_ENV=production

CMD ["./entrypoint.sh"]
