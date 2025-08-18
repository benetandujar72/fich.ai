FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
# Construye cliente (Vite) y servidor (esbuild)
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000

# Instala solo dependencias de producción para runtime más ligero
COPY package*.json ./
RUN npm ci --omit=dev

# Copia artefactos construidos
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/docker-entrypoint.prod.sh ./docker-entrypoint.prod.sh

EXPOSE 5000
CMD ["node", "dist/index.js"]


