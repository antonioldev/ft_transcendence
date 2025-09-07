#!/usr/bin/env bash
set -euo pipefail

# ===== Config =====
CERT_DIR=".certs"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
CA_DIR="$ROOT/$CERT_DIR/ca"
BE_DIR="$ROOT/$CERT_DIR/backend"
NG_DIR="$ROOT/$CERT_DIR/nginx"

mkdir -p "$CA_DIR" "$BE_DIR" "$NG_DIR"

echo "=> certs directory: $ROOT/$CERT_DIR"

# ===== 1) Root CA (create once) =====
if [[ ! -f "$CA_DIR/ca.key" ]]; then
  openssl genrsa -out "$CA_DIR/ca.key" 4096
else
  echo "=> CA key exists, skipping"
fi

if [[ ! -f "$CA_DIR/ca.crt" ]]; then
  openssl req -x509 -new -nodes -key "$CA_DIR/ca.key" -sha256 -days 3650 \
    -subj "/CN=ft-internal-ca" -out "$CA_DIR/ca.crt"
else
  echo "=> CA cert exists, skipping"
fi

# ===== 2) Backend cert (CN/SANs) =====
if [[ ! -f "$BE_DIR/backend.key" ]]; then
  openssl genrsa -out "$BE_DIR/backend.key" 2048
fi

cat > "$BE_DIR/backend.cnf" <<'EOF'
[req]
default_bits = 2048
prompt = no
default_md = sha256
req_extensions = req_ext
distinguished_name = dn
[dn]
CN = transcendence-backend
[req_ext]
subjectAltName = @alt_names
[alt_names]
DNS.1 = transcendence-backend
EOF

openssl req -new -key "$BE_DIR/backend.key" -out "$BE_DIR/backend.csr" -config "$BE_DIR/backend.cnf"

cat > "$BE_DIR/ca.ext" <<'EOF'
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, keyEncipherment
extendedKeyUsage=serverAuth
subjectAltName = @alt_names
[alt_names]
DNS.1 = transcendence-backend
EOF

openssl x509 -req -in "$BE_DIR/backend.csr" -CA "$CA_DIR/ca.crt" -CAkey "$CA_DIR/ca.key" -CAcreateserial \
  -out "$BE_DIR/backend.crt" -days 825 -sha256 -extfile "$BE_DIR/ca.ext"

# ===== 3) Site (Nginx) cert for HTTPS on localhost =====
if [[ ! -f "$NG_DIR/site.key" ]]; then
  openssl genrsa -out "$NG_DIR/site.key" 2048
fi

cat > "$NG_DIR/site.cnf" <<'EOF'
[req]
default_bits = 2048
prompt = no
default_md = sha256
req_extensions = req_ext
distinguished_name = dn

[dn]
CN = localhost

[req_ext]
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
IP.1  = 127.0.0.1
IP.2  = ::1
EOF

openssl req -new -key "$NG_DIR/site.key" -out "$NG_DIR/site.csr" -config "$NG_DIR/site.cnf"

cat > "$NG_DIR/ca.ext" <<'EOF'
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, keyEncipherment
extendedKeyUsage=serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
IP.1  = 127.0.0.1
IP.2  = ::1
EOF

openssl x509 -req -in "$NG_DIR/site.csr" -CA "$CA_DIR/ca.crt" -CAkey "$CA_DIR/ca.key" -CAcreateserial \
  -out "$NG_DIR/site.crt" -days 825 -sha256 -extfile "$NG_DIR/ca.ext"

# ===== Permissions =====
chmod 600 "$CA_DIR/ca.key" "$BE_DIR/backend.key" "$NG_DIR/site.key" || true
chmod 644 "$CA_DIR/ca.crt" "$BE_DIR/backend.crt" "$NG_DIR/site.crt" || true

echo ""
echo "✅ Done. Created/updated:"
echo "  $CERT_DIR/ca/ca.crt            (public CA)         <-- mount into Nginx to verify backend"
echo "  $CERT_DIR/backend/backend.crt  (backend server cert)"
echo "  $CERT_DIR/backend/backend.key  (backend private key)"
echo "  $CERT_DIR/nginx/site.crt       (browser-facing HTTPS cert for Nginx)"
echo "  $CERT_DIR/nginx/site.key       (browser-facing HTTPS key for Nginx)"
echo ""
