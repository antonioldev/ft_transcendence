# Uses Node.js 20 on Alpine, providing a lightweight base image
FROM node:20-alpine

# Sets up /app as the working directory for subsequent instructions
WORKDIR /app

# Copy package files first (better for Docker layer caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY src/ ./src/
COPY tsconfig.json ./

RUN npm run build

EXPOSE 3000

ENV ADDRESS=0.0.0.0 PORT=3000

CMD ["npm", "start"]

# https://dev.to/code42cate/how-to-dockerize-and-deploy-fastify-apis-3f7i
# https://fastify.dev/
# https://wiblok.com/en/nodejs/fastify/fastify-environment-setup-coremodule-cli-docker/