#!/bin/bash

# Servers Control Panel Deployment Script
# Run this on your Ubuntu server (5.78.126.101)

set -e

echo "🚀 Starting Servers Control Panel deployment..."

# Check if running as root or with sudo
if [[ $EUID -eq 0 ]]; then
   echo "❌ This script should not be run as root. Please run as a regular user with sudo access."
   exit 1
fi

# Generate a secure API key
API_KEY=$(openssl rand -hex 32)
echo "🔑 Generated API key: $API_KEY"

# Create .env file for backend
echo "📝 Creating backend environment file..."
cat > backend/.env << EOF
API_KEY=$API_KEY
NODE_ENV=production
EOF

# Setup SSL certificates
echo "🔒 Setting up SSL certificates..."
sudo ./setup-ssl.sh

# Build and start services
echo "🐳 Starting Docker services..."
export API_KEY=$API_KEY
docker-compose down 2>/dev/null || true
docker-compose build --no-cache
docker-compose up -d

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 10

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo "✅ Deployment successful!"
    echo ""
    echo "🌐 Dashboard available at: https://servers.conbackend.com"
    echo "🔑 API Key for agents: $API_KEY"
    echo ""
    echo "📋 Next steps:"
    echo "1. Update your DNS to point servers.conbackend.com to 5.78.126.101"
    echo "2. Install agents on your servers using the API key above"
    echo "3. Access the dashboard to monitor your servers"
    echo ""
    echo "🔄 To restart services: docker-compose restart"
    echo "📊 To view logs: docker-compose logs -f"
    echo "🛑 To stop services: docker-compose down"
else
    echo "❌ Deployment failed. Check logs with: docker-compose logs"
    exit 1
fi