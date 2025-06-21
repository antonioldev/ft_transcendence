# Build stage for TypeScript
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy TypeScript source
COPY src/ ./src/
COPY tsconfig.json ./

# Build TypeScript
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built JS files
COPY --from=builder /app/dist/ /usr/share/nginx/html/

# Copy HTML and other static files
COPY src/*.html /usr/share/nginx/html/

EXPOSE 80