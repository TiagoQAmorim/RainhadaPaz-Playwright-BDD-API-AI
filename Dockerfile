# Imagem oficial do Node. O Railpack da Railway instala o Node via mise e tem
# cancelado essa etapa antes de compilar o site.
FROM node:22-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN DATABASE_URL=file:./.railway-build.db npm ci

# Fotos das páginas. Sem esta pasta, os banners somem em produção.
COPY public/uploads/migrated ./public/uploads/migrated
COPY . .
# SQLite só desta etapa. Em produção a Railway injeta file:/data/rainhadapaz.db.
RUN DATABASE_URL=file:./.railway-build.db RAILWAY_PROJECT_ID=docker-build node scripts/next-build.mjs \
  && npm prune --omit=dev \
  && rm -f .railway-build.db

ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "scripts/ensure-db.mjs"]
