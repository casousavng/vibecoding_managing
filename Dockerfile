# Multi-stage build for vibecoding_managing
FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies (dev + prod)
COPY package.json package-lock.json ./
RUN npm ci

# Copy rest of source
COPY . .

# Build client + server (creates dist/index.cjs and dist/public)
RUN npm run build

# Production image
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000

# Install only production deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy build artifacts
COPY --from=build /app/dist ./dist

# Expose port
EXPOSE 5000

# Start server
CMD ["npm", "run", "start"]
