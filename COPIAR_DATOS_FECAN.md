# 🎯 COPIAR DATOS DE FECAN MANUALMENTE

## 📋 INSTRUCCIONES:

### PASO 1: Abre FECAN en Chrome

1. Abre Chrome
2. Ve a: `https://www.fecanbaloncesto.com/competicion/?id=1675&round=0` (SP NEGRO)
3. Espera a que cargue TODO (clasificación y partidos)

### PASO 2: Abre Developer Console

1. Presiona **F12** (o clic derecho → Inspeccionar)
2. Ve a la pestaña **"Console"**

### PASO 3: Copia y pega este código

```javascript
// ============================================
// EXTRACTOR DE DATOS FECAN
// ============================================

(function() {
    console.log('🚀 Extrayendo datos de FECAN...\n');
    
    const datos = {
        clasificacion: [],
        partidos: [],
        teamId: window.location.search.includes('1675') ? 'sp-negro' : 'sp-rosa'
    };
    
    // EXTRAER CLASIFICACIÓN
    const tablaClasificacion = document.querySelector('table');
    if (tablaClasificacion) {
        const filas = tablaClasificacion.querySelectorAll('tbody tr');
        filas.forEach((fila, index) => {
            const celdas = fila.querySelectorAll('td');
            if (celdas.length >= 8) {
                datos.clasificacion.push({
                    position: index + 1,
                    team_name: celdas[1]?.textContent.trim() || '',
                    played: parseInt(celdas[2]?.textContent.trim()) || 0,
                    won: parseInt(celdas[3]?.textContent.trim()) || 0,
                    lost: parseInt(celdas[4]?.textContent.trim()) || 0,
                    points_for: parseInt(celdas[5]?.textContent.trim()) || 0,
                    points_against: parseInt(celdas[6]?.textContent.trim()) || 0,
                    points: parseInt(celdas[7]?.textContent.trim()) || 0
                });
            }
        });
    }
    
    // EXTRAER PARTIDOS
    // Buscar todos los elementos que contengan info de partidos
    document.querySelectorAll('.match, .partido, .game, [class*="match"], [class*="jornada"]').forEach(elem => {
        const text = elem.textContent;
        // Aquí extraerías los partidos según la estructura de FECAN
        // Por ahora capturamos el texto para analizar
        if (text.length > 20 && text.length < 500) {
            datos.partidos.push({
                raw: text.trim()
            });
        }
    });
    
    console.log('✅ Extracción completada!\n');
    console.log(`📊 Clasificación: ${datos.clasificacion.length} equipos`);
    console.log(`⚽ Partidos: ${datos.partidos.length} encontrados`);
    console.log('\n📄 DATOS JSON (copia esto):');
    console.log('\n------------------------\n');
    console.log(JSON.stringify(datos, null, 2));
    console.log('\n------------------------\n');
    
    // Copiar automáticamente al portapapeles
    const jsonText = JSON.stringify(datos, null, 2);
    navigator.clipboard.writeText(jsonText).then(() => {
        console.log('✅ ¡Datos copiados al portapapeles!');
        console.log('\nAhora pégalos en un archivo llamado: datos-fecan.json');
    });
    
    return datos;
})();
```

### PASO 4: Presiona ENTER

El script extraerá los datos y los copiará automáticamente.

### PASO 5: Guarda los datos

1. Abre Notepad
2. Pega (Ctrl+V)
3. Guarda como: `datos-sp-negro.json` en `c:\Users\pablo\Desktop\SPBASKET\backend\`

### PASO 6: Repite para SP ROSA

1. Ve a: `https://www.fecanbaloncesto.com/competicion/?id=1674&round=0`
2. Ejecuta el mismo script
3. Guarda como: `datos-sp-rosa.json`

---

## 🔄 LUEGO, INSERTAMOS LOS DATOS

Una vez tengas los 2 archivos JSON, te daré un script Node.js que los inserte en la base de datos automáticamente.

---

## ❓ Si el script no funciona:

Mira en la consola qué errores da y dime. También puedes copiar manualmente los datos que veas en pantalla y me los pasas.

---

## 🎯 ¿ALTERNATIVA MÁS SIMPLE?

Si prefieres, simplemente:
1. Mira la tabla de clasificación en FECAN
2. Cópiala y pégamela aquí
3. Yo la formateo y la inserto

Lo que sea más fácil para ti! 💪
