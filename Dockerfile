FROM node:20 AS builder

WORKDIR /usr/src/app

# Copy ONLY package files first for better caching
COPY package*.json ./

# Install dependencies (including devDependencies)
RUN npm ci

# Copy other files (tsconfig, source code)
COPY tsconfig.json ./
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
