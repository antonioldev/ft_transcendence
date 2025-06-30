# Uses Node.js 20 on Alpine, providing a lightweight base image
FROM node:20-alpine

# Sets up /app as the working directory for subsequent instructions
WORKDIR /app

# Dependency installation:
COPY package* ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["node", "index.js"]

# https://dev.to/code42cate/how-to-dockerize-and-deploy-fastify-apis-3f7i
# https://fastify.dev/
# https://wiblok.com/en/nodejs/fastify/fastify-environment-setup-coremodule-cli-docker/