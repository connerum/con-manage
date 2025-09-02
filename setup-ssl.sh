#!/bin/bash

# Setup SSL certificates for servers.conbackend.com
# Run this on your Ubuntu server

# Install certbot
sudo apt update
sudo apt install -y certbot

# Get SSL certificate
sudo certbot certonly --standalone -d servers.conbackend.com

# Copy certificates to nginx/ssl directory
sudo cp /etc/letsencrypt/live/servers.conbackend.com/fullchain.pem ./nginx/ssl/
sudo cp /etc/letsencrypt/live/servers.conbackend.com/privkey.pem ./nginx/ssl/

# Set proper permissions
sudo chmod 600 ./nginx/ssl/privkey.pem
sudo chmod 644 ./nginx/ssl/fullchain.pem

echo "SSL certificates have been set up successfully!"
echo "Make sure to renew certificates before they expire:"
echo "sudo certbot renew"