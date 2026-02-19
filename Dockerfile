# Stage 1: Install dependencies
FROM oven/bun:1 AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Stage 2: Build (Node.js base with Bun — Next.js needs Node for page data collection)
FROM node:22-alpine AS build
RUN npm install -g bun
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx next build

# Stage 3: Install native deps for Alpine (serverExternalPackages need platform-matched binaries)
FROM node:22-alpine AS native-deps
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev pdf-parse pdfjs-dist @napi-rs/canvas

# Stage 4: Production
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=build /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static

# serverExternalPackages are not traced into standalone — copy from Alpine-built deps
COPY --from=native-deps --chown=nextjs:nodejs /app/node_modules/pdf-parse ./node_modules/pdf-parse
COPY --from=native-deps --chown=nextjs:nodejs /app/node_modules/pdfjs-dist ./node_modules/pdfjs-dist
COPY --from=native-deps --chown=nextjs:nodejs /app/node_modules/@napi-rs ./node_modules/@napi-rs

RUN mkdir -p /app/data && chown nextjs:nodejs /app/data
VOLUME /app/data

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
