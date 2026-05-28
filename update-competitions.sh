#!/bin/bash
echo "🚀 Iniciando sincronización de competiciones..."

# 1. Scrape SP Negro
echo "📡 Scrapeando SP Negro..."
curl -s "http://localhost:3001/api/scrape-live/sp-negro?force=true" > /dev/null

# 2. Scrape SP Rosa
echo "📡 Scrapeando SP Rosa..."
curl -s "http://localhost:3001/api/scrape-live/sp-rosa?force=true" > /dev/null

# 3. Descargar logos (por si el trigger automático falló o para forzar)
echo "🖼️ Sincronizando logos locales..."
node /var/www/spbasket/backend/download-logos.js

echo "✅ Sincronización finalizada con éxito."
