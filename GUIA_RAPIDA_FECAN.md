# 🎯 GUÍA RÁPIDA: COPIAR DATOS DE FECAN (5 MINUTOS)

## ✅ PASO A PASO:

### 1️⃣ Abre FECAN en Chrome (SP NEGRO)

```
https://www.fecanbaloncesto.com/competicion/?id=1675&round=0
```

### 2️⃣ Abre Console (F12 → Console)

### 3️⃣ Copia y pega TODO este código:

```javascript
(function(){console.log('🚀 Extrayendo...');const datos={clasificacion:[],partidos:[],teamId:window.location.search.includes('1675')?'sp-negro':'sp-rosa'};const tabla=document.querySelector('table');if(tabla){tabla.querySelectorAll('tbody tr').forEach((f,i)=>{const c=f.querySelectorAll('td');if(c.length>=8)datos.clasificacion.push({position:i+1,team_name:c[1]?.textContent.trim()||'',played:parseInt(c[2]?.textContent.trim())||0,won:parseInt(c[3]?.textContent.trim())||0,lost:parseInt(c[4]?.textContent.trim())||0,points_for:parseInt(c[5]?.textContent.trim())||0,points_against:parseInt(c[6]?.textContent.trim())||0,points:parseInt(c[7]?.textContent.trim())||0})})}console.log(`✅ ${datos.clasificacion.length} equipos`);const json=JSON.stringify(datos,null,2);navigator.clipboard.writeText(json);console.log('✅ Copiado!');console.log(json);return datos})();
```

### 4️⃣ Pega en archivo

1. Abre Notepad
2. Pega (Ctrl+V)
3. Guarda como: **`c:\Users\pablo\Desktop\SPBASKET\backend\datos-sp-negro.json`**

### 5️⃣ Repite para SP ROSA

1. Abre: `https://www.fecanbaloncesto.com/competicion/?id=1674&round=0`
2. Ejecuta el mismo código
3. Guarda como: **`c:\Users\pablo\Desktop\SPBASKET\backend\datos-sp-rosa.json`**

### 6️⃣ Inserta en la Base de Datos

Abre terminal en `backend/` y ejecuta:

```bash
node insert-fecan-manual.js
```

### 7️⃣ ¡LISTO! Abre tu web

```
http://localhost:4200/competiciones
```

¡Verás los datos REALES de FECAN! 🎉

---

## 🆘 ¿PROBLEMAS?

**Si el script no funciona:**
Simplemente copia la tabla que ves en FECAN y pégamela aquí. Yo la formateo.

**Si no sabes usar la consola:**
Dime y te guío paso a paso con más detalle.

---

## ⚡ VERSIÓN ULTRA SIMPLE:

¿Quieres que YO lo haga? Solo:
1. Copia la tabla de clasificación que ves en FECAN
2. Pégamela aquí
3. Yo creo el JSON y lo inserto

**Tú eliges el método que prefieras!** 💪
