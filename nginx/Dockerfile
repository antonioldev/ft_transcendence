FROM nginx:alpine

# Install openssl (apk, not apt)
RUN apk add --no-cache openssl

# Put your vhost directly in conf.d and remove the default
COPY transcendence.conf /etc/nginx/conf.d/transcendence.conf
RUN rm -f /etc/nginx/conf.d/default.conf

# Create cert dirs and generate a self-signed cert
RUN mkdir -p /etc/nginx/ssl/certs /etc/nginx/ssl/private && \
    openssl req -newkey rsa:4096 -x509 -sha256 -days 100 -nodes \
      -out /etc/nginx/ssl/certs/cert.crt \
      -keyout /etc/nginx/ssl/private/key.key \
      -subj "/C=UK/ST=ENGLAND/L=LONDON/O=42/OU=TRANSCENDENCE/CN=localhost"

EXPOSE 80 443
CMD ["nginx","-g","daemon off;"]