#!/bin/bash

ACCOUNT_ID=${MAXMIND_ACCOUNT_ID}
LICENSE_KEY=${MAXMIND_LICENSE_KEY}
DB_DIR="./data"

if [ -z "$ACCOUNT_ID" ] || [ -z "$LICENSE_KEY" ]; then
  echo "Error: MAXMIND_ACCOUNT_ID and MAXMIND_LICENSE_KEY must be set"
  exit 1
fi

echo "Downloading GeoLite2-City database..."

curl -s \
  "https://download.maxmind.com/geoip/databases/GeoLite2-City/download?suffix=tar.gz" \
  --user "${ACCOUNT_ID}:${LICENSE_KEY}" \
  -o /tmp/GeoLite2-City.tar.gz

tar -xzf /tmp/GeoLite2-City.tar.gz -C /tmp/
find /tmp -name "GeoLite2-City.mmdb" -exec mv {} ${DB_DIR}/GeoLite2-City.mmdb \;
rm -f /tmp/GeoLite2-City.tar.gz

echo "✅ GeoLite2-City.mmdb updated"