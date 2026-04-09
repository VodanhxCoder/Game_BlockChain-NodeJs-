FROM node:20-bookworm-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci

# fail2ban has its own package.json and runtime deps
COPY services/fail2ban_service/package*.json ./services/fail2ban_service/
RUN npm --prefix services/fail2ban_service ci

COPY . .

ENV NODE_ENV=production

# Default command is overridden by docker-compose service commands
CMD ["node", "services/start-all-services.cjs"]
