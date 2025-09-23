
# Build stage for TypeScript
# FROM node:alpine AS builder
# # Using a builder stage to save space by only copying the necessary build artifacts to the final image

# ======================
# MODO DESENVOLVIMENTO
# ======================
FROM node:alpine AS dev
>>>>>>> d02dc99 (feat: Configure Vite as development server and build tool)
WORKDIR /app

COPY package*.json package-lock.json ./
RUN npm install

COPY src/ ./src/
COPY index.html ./
COPY tsconfig.json ./
COPY tailwind.config.js ./
COPY postcss.config.js ./
COPY vite.config.js ./

EXPOSE 5173

CMD ["npm", "run", "dev"]

# Copy built JS files
COPY --from=builder /app/dist/ /usr/share/nginx/html/
ARG GOOGLE_CLIENT_ID
RUN sh -c "echo \"window.GOOGLE_CLIENT_ID='${GOOGLE_CLIENT_ID}';\" > /usr/share/nginx/html/env-config.js"

# COPY mime.types /etc/nginx/mime.types

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