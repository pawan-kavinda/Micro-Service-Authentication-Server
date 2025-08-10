# ---- Stage 1: Build ----
FROM node:18-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and build
COPY . .
RUN npm run build

# ---- Stage 2: Production ----
FROM node:18-alpine
WORKDIR /app

# Set environment
ENV NODE_ENV=production

# Copy only necessary files for production
COPY package*.json ./
RUN npm ci --omit=dev

# Copy build output from builder stage
COPY --from=builder /app/dist ./dist

# Expose NestJS default port
EXPOSE 4001

# Start the app
CMD ["node", "dist/main.js"]
