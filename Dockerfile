FROM node:22-alpine AS base
WORKDIR /app

# 1. Dependencias de desarrollo y build
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# 2. Compilación del proyecto
FROM base AS build
ARG PUBLIC_SHOW_PRODUCT_IMAGES=false
ENV PUBLIC_SHOW_PRODUCT_IMAGES=$PUBLIC_SHOW_PRODUCT_IMAGES

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Limpiar devDependencies para dejar solo producción
RUN npm prune --production

# 3. Imagen de ejecución limpia
FROM base AS runtime
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321

# Copiar solo node_modules de producción y el resultado del build
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json

EXPOSE 4321
USER node

CMD ["node", "./dist/server/entry.mjs"]