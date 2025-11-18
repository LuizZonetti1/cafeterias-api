# Imagem base leve com Node 20
FROM node:20-alpine

# Criar diretório da aplicação
WORKDIR /app

# Habilitar pnpm via corepack
RUN corepack enable

# Copiar manifestos
COPY package.json pnpm-lock.yaml ./

# Instalar dependências (inclui dev para gerar Prisma client)
RUN pnpm install --frozen-lockfile

# Copiar schema Prisma e gerar client
COPY prisma ./prisma
RUN pnpm db:generate

# Copiar código restante
COPY src ./src
COPY uploads ./uploads

# Variáveis padrão (Render sobrescreve PORT automaticamente)
ENV NODE_ENV=production
ENV PORT=3333

EXPOSE 3333

# Inicializar servidor
CMD ["pnpm", "start"]
