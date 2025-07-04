FROM node:22-alpine AS base
	WORKDIR /mobietrain
  COPY package*.json ./
	RUN npm ci --only=prod --no-optional --no-audit --no-fund

# builder
FROM base AS builder
  RUN npm install --only=dev --no-optional --no-audit --no-fund
  COPY . .
  RUN npm run build

# runner
FROM base AS runner
  COPY --from=builder /mobietrain/dist /mobietrain/dist
  COPY --from=builder /mobietrain/doc /mobietrain/doc
  CMD ["node", "--require", "./dist/instrumentation.js", "./dist/index.js"]
	EXPOSE 8080
