# ======================
# MODO DESENVOLVIMENTO
# ======================
FROM node:alpine AS dev
WORKDIR /app

COPY package*.json package-lock.json ./
RUN npm install

COPY src/ ./src/
COPY tsconfig.json ./
COPY tailwind.config.js ./
COPY postcss.config.js ./
COPY vite.config.js ./

EXPOSE 5173

CMD ["npm", "run", "dev"]


# # Build stage for TypeScript
# FROM node:alpine AS builder
# # Using a builder stage to save space by only copying the necessary build artifacts to the final image

# WORKDIR /app

# # Copy package files
# COPY package*.json package-lock.json ./

# # Install dependencies
# RUN npm install

# # Pass GOOGLE_CLIENT_ID as a build argument
# ARG GOOGLE_CLIENT_ID

# # Inject GOOGLE_CLIENT_ID into the frontend code
# RUN mkdir -p /app/dist && echo "window.GOOGLE_CLIENT_ID = '${GOOGLE_CLIENT_ID}';" > /app/dist/env-config.js

# # Copy TypeScript source and config files
# COPY src/ ./src/
# COPY tsconfig.json ./
# COPY tailwind.config.js ./
# COPY postcss.config.js ./

# # Build TypeScript and CSS
# RUN npm run build

# # Production stage
# FROM nginx:alpine

# # Copy built JS files
# COPY --from=builder /app/dist/ /usr/share/nginx/html/
# # COPY mime.types /etc/nginx/mime.types

# # Copy HTML and other static files
# COPY src/*.html /usr/share/nginx/html/
# COPY src/42_favicon.ico /usr/share/nginx/html/
# COPY src/atari.png /usr/share/nginx/html/
# COPY src/assets/ /usr/share/nginx/html/assets/

# EXPOSE 80