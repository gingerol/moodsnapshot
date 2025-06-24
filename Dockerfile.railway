# Railway Dockerfile - Simple approach
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with legacy peer deps to avoid conflicts
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build the application
RUN npm run build:prod

# Remove dev dependencies to save space
RUN npm prune --production

# Expose port
EXPOSE $PORT

# Start the server
CMD ["node", "simple.js"]