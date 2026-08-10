FROM node:22-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS build
ARG PUBLIC_SHOW_PRODUCT_IMAGES=false
ENV PUBLIC_SHOW_PRODUCT_IMAGES=$PUBLIC_SHOW_PRODUCT_IMAGES
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runtime
ENV NODE_ENV=production
ENV PUBLIC_SHOW_PRODUCT_IMAGES=false
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/public ./public
EXPOSE 4321
USER node
CMD ["node", "./dist/server/entry.mjs"]
