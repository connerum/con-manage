#!/bin/bash

# Servers Control Panel Management Script

set -e

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "❌ This script must be run as root. Use: sudo $0 <command>"
   exit 1
fi

COMMAND=${1:-status}

case $COMMAND in
    start)
        echo "▶️ Starting services..."
        systemctl start servers-control-panel
        systemctl start servers-frontend
        echo "✅ Services started"
        ;;
    stop)
        echo "⏹️ Stopping services..."
        systemctl stop servers-control-panel
        systemctl stop servers-frontend
        echo "✅ Services stopped"
        ;;
    restart)
        echo "🔄 Restarting services..."
        systemctl restart servers-control-panel
        systemctl restart servers-frontend
        echo "✅ Services restarted"
        ;;
    status)
        echo "📊 Service status:"
        systemctl status servers-control-panel --no-pager -l
        echo ""
        systemctl status servers-frontend --no-pager -l
        ;;
    logs)
        SERVICE=${2:-servers-control-panel}
        echo "📋 Logs for $SERVICE:"
        journalctl -u $SERVICE -f
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|logs [service]}"
        echo "Services: servers-control-panel, servers-frontend"
        exit 1
        ;;
esac