# Build stage for TypeScript
FROM node:24-alpine AS builder
# Using a builder stage to save space by only copying the necessary build artifacts to the final image

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the entire source code to the working directory
COPY . .

# # Copy TypeScript source
# COPY src/ ./src/
# # COPY src/index.html ./
# COPY tsconfig.json ./
# COPY vite.config.js ./

# Build TypeScript 
RUN npm run build

# Pass GOOGLE_CLIENT_ID as a build argument
ARG GOOGLE_CLIENT_ID

# Inject GOOGLE_CLIENT_ID into the frontend code
RUN echo "window.GOOGLE_CLIENT_ID = '${GOOGLE_CLIENT_ID}';" > /app/env-config.js

# Production stage
FROM nginx:alpine

# Copy built JS files
COPY --from=builder /app/dist/ /usr/share/nginx/html/

# Copy environment config file
COPY --from=builder /app/env-config.js /usr/share/nginx/html/

# COPY mime.types /etc/nginx/mime.types

# # Copy HTML and other static files
# COPY src/*.html /usr/share/nginx/html/
# COPY src/assets/images/42_favicon.ico /usr/share/nginx/html/
COPY src/assets/ /usr/share/nginx/html/assets/

EXPOSE 80