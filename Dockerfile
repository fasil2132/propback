FROM node:20

WORKDIR /usr/src/app

# Copy package files first for better caching
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production

# Copy all source files
COPY . .

# Build TypeScript
RUN npm run build

# Verify build output
RUN ls -la build/

EXPOSE 3000

# Use absolute path to entry point
CMD ["node", "/usr/src/app/build/index.js"]
