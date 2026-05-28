$password = "Saskipenguins2o24@"
$server = "root@94.143.142.26"

Write-Host "=== DESPLEGANDO FRONTEND ==="

# Upload frontend files
$localPath = "sp-basket\dist\sp-basket\browser\*"
$remotePath = "/var/www/html/"

Write-Host "Subiendo archivos frontend..."
echo $password | scp -o StrictHostKeyChecking=no -r $localPath ${server}:$remotePath

# Upload backend server.js
Write-Host "Subiendo backend..."
echo $password | scp -o StrictHostKeyChecking=no backend\server.js ${server}:/var/www/spbasket/backend/

# Restart server
Write-Host "Reiniciando servidor..."
echo $password | ssh -o StrictHostKeyChecking=no $server "pm2 restart all"

Write-Host "=== DESPLIEGUE COMPLETADO ==="
