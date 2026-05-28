@echo off
set PASSWORD=Saskipenguins2o24@
set SERVER=root@94.143.142.26

echo === UPLOADING DATA TO SERVER ===
scp backend/insert-parsed-db.js %SERVER%:/var/www/spbasket/backend/
scp backend/parsed_manual_data.json %SERVER%:/var/www/spbasket/backend/

echo === RUNNING IMPORT ON SERVER ===
ssh %SERVER% "cd /var/www/spbasket/backend && node insert-parsed-db.js"

echo === DATA SYNC COMPLETE ===
pause
