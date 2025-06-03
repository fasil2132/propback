FROM node:20

WORKDIR /src/app

# Copy package files and configs
COPY package*.json ./
COPY tsconfig.json ./

# Install ONLY production dependencies
RUN npm ci --only=production

# Copy all source files
COPY . .

# Build TypeScript to /usr/src/app/build
RUN npm run build

# Verify build output (debugging)
RUN ls -la build/

EXPOSE 3000

# Run from the built output
CMD ["node", "build/index.js"]
