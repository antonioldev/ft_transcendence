# Uses Node.js 20 on Alpine, Alpine is used toproviding a lightweight base image
FROM node:alpine
# Using a builder stage to save space by only copying the necessary build artifacts to the final image

# Sets up /app as the working directory
WORKDIR /app

# Copy package files before installing npm
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY src/ ./src/
COPY tsconfig.json ./

# Build the application
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]

# Use a smaller image for the final stage to reduce the image size
# test show reduction from 228MB to 178MB
# FROM node:alpine AS runner

# Set /app as the working directory
# WORKDIR /app

# Copy only the necessary files from the builder stage
# COPY --from=builder /app/dist ./dist
# COPY --from=builder /app/node_modules ./node_modules
# COPY --from=builder /app/package*.json ./

# Expose the port
# EXPOSE 3000

# CMD ["npm", "start"]

# https://dev.to/code42cate/how-to-dockerize-and-deploy-fastify-apis-3f7i
# https://fastify.dev/
# https://wiblok.com/en/nodejs/fastify/fastify-environment-setup-coremodule-cli-docker/