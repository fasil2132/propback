FROM node:20 AS builder

WORKDIR /usr/src/app

# Copy package files first
COPY package*.json ./
COPY tsconfig.json ./

# Install ALL dependencies (including devDependencies)
RUN npm ci

# Copy all source files
COPY . .

# Build TypeScript
RUN npm run build

# --- Production Stage ---
FROM node:20-slim

WORKDIR /usr/src/app

# Copy production dependencies
COPY --from=builder /usr/src/app/package*.json ./
RUN npm ci --only=production

# Copy built files
COPY --from=builder /usr/src/app/build ./build

EXPOSE 3000
CMD ["node", "build/index.js"]
