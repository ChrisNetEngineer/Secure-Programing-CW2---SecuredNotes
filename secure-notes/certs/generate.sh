#!/bin/sh
set -eu

cd /certs

if [ -f ca.crt ] && [ -f backend.crt ] && [ -f db.crt ] && [ -f localhost.crt ]; then
  echo "TLS material already present."
  chmod 644 ./*.crt ./backend.key ./localhost.key 2>/dev/null || true
  chmod 600 ./ca.key ./db.key 2>/dev/null || true
  chown 999:999 ./db.key
  exit 0
fi

sign() {
  name=$1
  san=$2
  openssl genrsa -out "$name.key" 2048
  openssl req -new -key "$name.key" -out "$name.csr" -subj "/CN=$name"
  printf "subjectAltName=%s\n" "$san" > "$name.ext"
  openssl x509 -req -in "$name.csr" -CA ca.crt -CAkey ca.key -CAcreateserial \
    -out "$name.crt" -days 365 -sha256 -extfile "$name.ext"
  rm -f "$name.csr" "$name.ext"
}

openssl genrsa -out ca.key 2048
openssl req -x509 -new -nodes -key ca.key -sha256 -days 3650 -out ca.crt \
  -subj "/CN=SecureNotesCA"

sign localhost "DNS:localhost,IP:127.0.0.1"
sign backend "DNS:backend"
sign db "DNS:db"

chmod 644 ./*.crt ./backend.key ./localhost.key
chmod 600 ./ca.key ./db.key
chown 999:999 ./db.key

echo "Issued CA, localhost, backend, and db certificates."
