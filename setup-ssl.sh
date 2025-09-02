#!/bin/bash

# Setup SSL certificates for servers.conbackend.com
# Run this on your Ubuntu server

set -e

# Create nginx/ssl directory if it doesn't exist
mkdir -p ./nginx/ssl

# Install certbot if not already installed
if ! command -v certbot &> /dev/null; then
    echo "Installing Certbot..."
    apt update
    apt install -y certbot
fi

# Check if certificate already exists and handle key type change
if certbot certificates | grep -q "servers.conbackend.com"; then
    echo "Certificate exists. Reissuing with RSA key type..."
    certbot certonly --standalone --cert-name servers.conbackend.com --key-type rsa --force-renewal -d servers.conbackend.com
else
    echo "Getting new SSL certificate..."
    certbot certonly --standalone --key-type rsa -d servers.conbackend.com
fi

# Copy certificates to nginx/ssl directory
echo "Copying certificates..."
cp /etc/letsencrypt/live/servers.conbackend.com/fullchain.pem ./nginx/ssl/
cp /etc/letsencrypt/live/servers.conbackend.com/privkey.pem ./nginx/ssl/

# Set proper permissions
chmod 600 ./nginx/ssl/privkey.pem
chmod 644 ./nginx/ssl/fullchain.pem

echo "SSL certificates have been set up successfully!"
echo "Certificate files copied to ./nginx/ssl/"
echo ""
echo "Make sure to renew certificates before they expire:"
echo "sudo certbot renew --cert-name servers.conbackend.com"