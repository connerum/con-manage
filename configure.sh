#!/bin/bash

# Servers Control Panel Configuration Script
# Run this after install.sh

set -e

echo "⚙️ Configuring Servers Control Panel..."

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "❌ This script must be run as root. Use: sudo $0"
   exit 1
fi

APP_DIR="/home/con-manage"

# Generate API key if not provided
if [ -z "$API_KEY" ]; then
    API_KEY=$(openssl rand -hex 32)
    echo "🔑 Generated API key: $API_KEY"
fi

# Create backend environment file
echo "📝 Creating backend environment..."
cat > "$APP_DIR/backend/.env" << EOF
API_KEY=$API_KEY
NODE_ENV=production
EOF
chown www-data:www-data "$APP_DIR/backend/.env"

# Create agent environment file (for local testing)
cat > "$APP_DIR/agent/.env" << EOF
SERVER_URL=https://servers.conbackend.com
API_KEY=$API_KEY
SERVER_NAME=$(hostname)
EOF
chown www-data:www-data "$APP_DIR/agent/.env"

# SSL Certificate setup
echo "🔒 Setting up SSL certificates..."
if ! certbot certificates | grep -q "servers.conbackend.com"; then
    echo "Getting new SSL certificate..."
    certbot certonly --standalone --key-type rsa -d servers.conbackend.com
else
    echo "SSL certificate already exists."
fi

# Nginx configuration
echo "🌐 Configuring Nginx..."
NGINX_CONF="/etc/nginx/sites-available/servers-control-panel.conf"
if [ ! -f "$NGINX_CONF" ]; then
    cp "$APP_DIR/nginx/servers-control-panel.conf" "$NGINX_CONF"
    ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/
fi

# Test nginx configuration
nginx -t

# Reload nginx
systemctl reload nginx

# Enable and start services
echo "▶️ Starting services..."
systemctl enable servers-control-panel
systemctl enable servers-frontend

systemctl start servers-control-panel
systemctl start servers-frontend

# Check service status
echo "📊 Service status:"
systemctl status servers-control-panel --no-pager -l
systemctl status servers-frontend --no-pager -l

echo "✅ Configuration completed!"
echo ""
echo "🌐 Dashboard available at: https://servers.conbackend.com"
echo "🔑 API Key for agents: $API_KEY"
echo ""
echo "📋 Useful commands:"
echo "  View logs: journalctl -u servers-control-panel -f"
echo "  Restart backend: systemctl restart servers-control-panel"
echo "  Restart frontend: systemctl restart servers-frontend"
echo "  Check status: systemctl status servers-control-panel servers-frontend"