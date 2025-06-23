# Railway Dockerfile - Express Server
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build:prod

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy server and built files
COPY server.js ./
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE $PORT

# Start the Express server
CMD ["npm", "start"]