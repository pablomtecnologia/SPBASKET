#!/bin/bash
set -e

echo "=== Leyendo config actual de Nginx ==="
cat /etc/nginx/sites-available/spbasket

echo ""
echo "=== Haciendo backup ==="
cp /etc/nginx/sites-available/spbasket /etc/nginx/sites-available/spbasket.bak

echo "=== Actualizando server_name ==="
# Reemplaza cualquier server_name que tenga saskipenguins para añadir spbasket
sed -i 's/server_name saskipenguins\.com www\.saskipenguins\.com;/server_name saskipenguins.com www.saskipenguins.com spbasket.com www.spbasket.com;/g' /etc/nginx/sites-available/spbasket

# También reemplaza si tiene server_name _; (comodín) 
sed -i 's/server_name _;/server_name saskipenguins.com www.saskipenguins.com spbasket.com www.spbasket.com;/g' /etc/nginx/sites-available/spbasket

echo "=== Config actualizada ==="
cat /etc/nginx/sites-available/spbasket

echo ""
echo "=== Verificando sintaxis Nginx ==="
nginx -t

echo "=== Recargando Nginx ==="
systemctl reload nginx

echo ""
echo "=== Generando certificado SSL para spbasket.com ==="
certbot --nginx -d spbasket.com -d www.spbasket.com --non-interactive --agree-tos --email admin@spbasket.com --redirect

echo ""
echo "=== Verificando Nginx final ==="
nginx -t

echo "=== Recargando Nginx con SSL ==="
systemctl reload nginx

echo ""
echo "✅ COMPLETADO! spbasket.com debería estar funcionando con HTTPS."
