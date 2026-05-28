#!/bin/bash

# ==========================================
# SP BASKET - VPS SETUP SCRIPT
# ==========================================
# This script sets up a Debian/Ubuntu VPS for SP Basket with:
# - Node.js (v20)
# - PostgreSQL
# - Nginx (Reverse Proxy)
# - PM2 (Process Manager)
# - UFW Firewall
# ==========================================

set -e # Exit on error

# --- Configuration ---
APP_DIR="/var/www/spbasket"
DB_NAME="spbasket"
DB_USER="spbasket_user"
# Generate a random password for the database
DB_PASS=$(openssl rand -base64 12)
PORT_BACKEND=3001

echo ">>> Starting Deployment Setup..."

# 1. Update System
echo ">>> Updating system packages..."
apt-get update -y && apt-get upgrade -y
apt-get install -y curl git unzip gnupg2 build-essential ufw openssl

# 2. Install Node.js 20
echo ">>> Installing Node.js 20..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi
echo "Node Version: $(node -v)"

# 3. Install PostgreSQL
echo ">>> Installing PostgreSQL..."
apt-get install -y postgresql postgresql-contrib

# 4. Configure PostgreSQL
echo ">>> Configuring Database..."
# Reset user/db if exists or create new
sudo -u postgres psql -c "DROP DATABASE IF EXISTS $DB_NAME;" || true
sudo -u postgres psql -c "DROP USER IF EXISTS $DB_USER;" || true
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';"
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

# 5. Install Nginx
echo ">>> Installing Nginx..."
apt-get install -y nginx

# 6. Setup Directory Structure
echo ">>> Setting up directories..."
mkdir -p $APP_DIR
# We assume the script is running from the root of the uploaded files
# Copy backend
cp -r backend $APP_DIR/
# Copy frontend (dist)
cp -r dist $APP_DIR/

# 7. Setup Backend
echo ">>> Setting up Backend..."
cd $APP_DIR/backend
npm install
# Create .env file
cat > .env <<EOL
PORT=$PORT_BACKEND
JWT_SECRET=$(openssl rand -hex 32)
DATABASE_URL=postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME
# Add other env vars here (SMTP, Stripe) if needed
# SMTP_USER=...
# SMTP_PASS=...
EOL

# 8. Setup PM2
echo ">>> Starting Backend with PM2..."
npm install -g pm2
pm2 delete spbasket-api || true
pm2 start server.js --name spbasket-api
pm2 save
pm2 startup | bash || true

# 8.1 Seed Database
echo ">>> Waiting for tables to be created..."
sleep 10 # Wait for server.js to init DB
echo ">>> Seeding Database..."
sudo -u postgres psql -d $DB_NAME -f $APP_DIR/backend/seed.sql || echo "Seeding failed (maybe tables not ready?)"

# 9. Configure Nginx
echo ">>> Configuring Nginx..."
cat > /etc/nginx/sites-available/spbasket <<EOL
server {
    listen 80;
    server_name _; # Catch all (IP or Domain)

    root $APP_DIR/dist/sp-basket/browser; # Check this path after build!
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:$PORT_BACKEND;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOL

# Enable Site
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/spbasket /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx

# 10. Firewall
echo ">>> Configuring Firewall..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
# ufw enable # CAREFUL: Non-interactive enable might block ssh if not configured right. Leaving disabled for user to check.
echo ">>> Firewall rules added. Run 'ufw enable' manually if you want to enable it."

echo "=========================================="
echo "   DEPLOYMENT COMPLETE!"
echo "=========================================="
echo "Backend is running on localhost:$PORT_BACKEND"
echo "Frontend is served on port 80"
echo "Database Password (generated): $DB_PASS"
echo "Please check http://<YOUR_IP>/"
