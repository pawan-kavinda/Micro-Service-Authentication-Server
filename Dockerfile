# ---- Stage 1: Build ----
FROM node:latest AS builder
WORKDIR /app

# Install only production deps first for caching
COPY package*.json ./
RUN npm ci

# Copy the rest of the source code and build
COPY . .
RUN npm run build

# ---- Stage 2: Production ----
FROM node:latest AS production
WORKDIR /app

ENV NODE_ENV=production

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy build output from builder
COPY --from=builder /app/dist ./dist

# Expose NestJS default port
EXPOSE 4001

CMD ["node", "dist/main.js"]
