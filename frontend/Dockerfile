

# Build stage for TypeScript
FROM node:alpine AS builder
# Using a builder stage to save space by only copying the necessary build artifacts to the final image

WORKDIR /app

ARG GOOGLE_CLIENT_ID

# Ensure GOOGLE_CLIENT_ID is set
RUN test -n "$GOOGLE_CLIENT_ID"

# Copy package files
COPY package*.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy TypeScript source
COPY src/ ./src/
COPY tsconfig.json ./

# Build TypeScript
RUN npm run build

# Create a file with the Google Client ID
RUN echo "window.GOOGLE_CLIENT_ID = '${GOOGLE_CLIENT_ID}';" > /app/dist/config.js

# Production stage
FROM nginx:alpine

# Copy built JS files
COPY --from=builder /app/dist/ /usr/share/nginx/html/

# Copy HTML and other static files
COPY src/*.html /usr/share/nginx/html/
COPY src/favicon.ico /usr/share/nginx/html/

EXPOSE 80