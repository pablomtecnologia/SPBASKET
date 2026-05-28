# deploy_pro.ps1
echo "🏗️  Paso 1: Construyendo el frontend..."
cd sp-basket
npm run build

if ($LASTEXITCODE -ne 0) { echo "❌ Error en el build"; exit }

echo "📦 Paso 2: Comprimiendo archivos..."
if (Test-Path "dist.zip") { Remove-Item "dist.zip" }
Compress-Archive -Path "dist/sp-basket/browser/*" -DestinationPath "dist.zip"

echo "🚀 Paso 3: Subiendo al servidor..."
scp -o StrictHostKeyChecking=no dist.zip root@94.143.142.26:/tmp/

echo "🔧 Paso 4: Desplegando en el servidor..."
ssh -o StrictHostKeyChecking=no root@94.143.142.26 "unzip -o /tmp/dist.zip -d /var/www/spbasket/frontend/dist/sp-basket/browser/ && rm /tmp/dist.zip"

echo "✨  ¡Despliegue completado con éxito!"
