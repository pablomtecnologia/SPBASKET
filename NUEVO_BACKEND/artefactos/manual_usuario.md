# Manual de Usuario - SPBASKET 3x3

Bienvenido al sistema de gestión de torneos **SPBASKET 3x3**. Este manual recoge el funcionamiento actual de la aplicación y resume los flujos principales de trabajo para administración, competición, calendario, oficiales, monitor y portal público.

---

## 1. Acceso al sistema

### 1.1 Panel de administración
- URL: `http://localhost:3009/gestion-privada-penguin`
- Desde aquí se gestionan torneos, categorías, equipos, jugadores, pistas, oficiales, calendario, clasificación y configuración general.

### 1.2 Portal público
- URL: `http://localhost:3009/public/:id`
- Muestra información del torneo, categorías, calendario, resultados, clasificación y cuadros eliminatorios.

### 1.3 Acta digital / marcador
- URL: `http://localhost:3009/marcador/acta/:id/:pista`
- Pensado para oficiales de mesa en pista.

### 1.4 Monitor TV
- URL: `http://localhost:3009/live/:id`
- Diseñado para pantallas grandes con partidos en juego y próximos.

---

## 2. Funcionalidades principales

El sistema permite:
- Crear y editar torneos.
- Clonar torneos existentes para reutilizar configuración.
- Gestionar categorías, equipos, jugadores y oficiales.
- Configurar jornadas, franjas horarias, pistas y restricciones por categoría.
- Generar partidos de grupos y fases eliminatorias.
- Configurar partido de 3º y 4º puesto cuando la lógica lo contemple.
- Generar, editar y borrar calendario.
- Activar partidos y registrar resultados manuales o desde acta digital.
- Sincronizar marcador, faltas y cronómetro en administración, monitor y portal público.
- Publicar información del torneo, carteles y patrocinadores.

---

## 3. Flujo recomendado de trabajo

### 3.1 Crear o clonar torneo
- Crea un torneo nuevo desde la pestaña de torneos.
- Si ya tienes una edición previa, usa la opción de **clonar torneo** para copiar parámetros, categorías, oficiales y otros datos reutilizables.

### 3.2 Configurar datos generales
- Define nombre, sede, número de pistas y parámetros base.
- Configura:
  - `Tiempo de ronda`
  - `Tiempo de partido`
  - `Modo estricto de calendario`
  - `Frecuencia de refresco del monitor`
  - `Asignación de oficiales a pista`
  - Lógica de grupos aplicable al torneo

### 3.3 Crear jornadas y franjas horarias
- En cada jornada defines:
  - día
  - hora de inicio
  - hora de fin
  - duración de ronda
  - duración real de partido
  - rondas de descanso entre partidos

### 3.4 Configurar pistas por jornada
- Desde la configuración de pistas decides:
  - qué pistas están abiertas
  - qué pistas están cerradas
  - qué categorías pueden jugar en cada pista y jornada

### 3.5 Cargar categorías, equipos y jugadores
- Crea las categorías del torneo.
- Inscribe los equipos dentro de cada categoría.
- Registra jugadores por equipo.

### 3.6 Generar estructura de competición
- Genera los partidos de grupos.
- Si la lógica de competición lo define, el sistema generará automáticamente fases finales, cuadros eliminatorios y, cuando proceda, el partido de 3º y 4º puesto.

### 3.7 Generar calendario
- Una vez creados partidos, jornadas y pistas, genera el calendario.
- El sistema intentará respetar:
  - disponibilidad de pistas
  - categorías permitidas por pista
  - orden de fases
  - descansos entre partidos del mismo equipo
  - concentración de finales

---

## 4. Gestión de jornadas y descansos

### 4.1 Rondas de descanso
Cada jornada puede tener un valor propio de `Rondas de Descanso`.

Significado:
- `0`: permite que un mismo equipo juegue en la franja inmediatamente siguiente.
- `1`: obliga a dejar 1 franja libre entre partidos del mismo equipo.
- `2`: obliga a dejar 2 franjas libres.
- `N`: obliga a dejar `N` franjas libres.

Ejemplo:
- Si la duración de ronda es 15 minutos:
  - con `0`, un equipo puede jugar a las `09:00` y después a las `09:15`
  - con `1`, podría jugar a las `09:00` y después a las `09:30`

### 4.2 Importante sobre cambios de jornadas
Si modificas cualquiera de estos elementos:
- jornadas
- duración de ronda
- duración de partido
- rondas de descanso
- configuración de pistas

los partidos ya programados no se recalculan automáticamente. Debes:
1. borrar el calendario existente
2. volver a generar el calendario

---

## 5. Gestión de categorías y competición

### 5.1 Categorías
Cada categoría puede tener:
- nombre
- género
- color identificativo
- condición de veteranos
- equipos y jugadores asociados

### 5.2 Lógica de grupos
El sistema utiliza una lógica parametrizable para decidir:
- cuántos grupos se generan
- cuántas vueltas hay en fase de grupos
- qué posiciones clasifican
- si existe fase final
- si se juega 3º y 4º puesto

### 5.3 Partidos y clasificación
En la sección de competición puedes:
- generar partidos
- regenerar estructura si no hay resultados bloqueantes
- ver grupos, cruces y clasificación
- consultar ranking final del torneo

### 5.4 Bloqueos de seguridad
El sistema protege la integridad de la competición:
- no deja regenerar o borrar si hay resultados que lo impiden
- bloquea operaciones sensibles cuando ya existe calendario o resultados
- evita inconsistencias entre equipos, grupos y partidos

---

## 6. Gestión del calendario

### 6.1 Generación
- Genera el calendario desde la pestaña de calendario.
- El motor asigna fecha, hora y pista a cada partido.

### 6.2 Edición manual
Puedes editar manualmente un partido programado:
- cambiar fecha
- cambiar hora
- cambiar pista

El sistema validará:
- conflicto de pista
- conflicto de equipos
- descansos mínimos
- orden lógico de fases
- disponibilidad de la pista para la categoría

### 6.3 Activación de partidos
- Puedes activar manualmente partidos desde administración.
- La activación impacta en monitor, acta digital y visibilidad operativa.

### 6.4 Cronómetro global
En la parte superior del calendario se muestra un cronómetro global que:
- sincroniza el tiempo de juego
- se refleja en el acta digital
- ayuda a coordinar toda la jornada

---

## 7. Resultados, faltas y acta digital

### 7.1 Introducción manual de resultados
Desde administración puedes:
- introducir marcador
- corregir marcador
- revisar resultados ya registrados

### 7.2 Acta digital
Cada oficial de mesa puede usar la pantalla de acta para:
- sumar puntos
- registrar faltas
- controlar el tiempo
- finalizar el partido

### 7.3 Sincronización de faltas
Las faltas de equipo se reflejan en tiempo real en:
- calendario administrativo
- monitor TV
- portal público cuando el partido está en juego

### 7.4 Registro de eventos
El sistema guarda trazabilidad de acciones relevantes, incluyendo:
- puntuaciones
- faltas
- tiempo de juego asociado a cada acción

---

## 8. Monitor TV

El monitor está pensado para visualización pública en sede.

Características actuales:
- muestra partidos en juego y próximos
- agrupación por rondas/franjas horarias
- actualización automática periódica
- visualización de marcador y faltas
- modo pantalla completa con `F4`
- rotación de publicidad/imágenes del torneo
- diferenciación visual por categoría y fase

---

## 9. Portal público

El portal público permite a jugadores, familias y público consultar:
- información general del torneo
- categorías disponibles
- calendario
- resultados
- clasificación
- cuadros eliminatorios
- partido de 3º y 4º puesto si existe
- imagen de patrocinadores

Comportamiento destacado:
- solo muestra categorías con información útil publicada
- refresca datos automáticamente
- refleja resultados y clasificación en tiempo casi real

---

## 10. Oficiales y pistas

### 10.1 Gestión de oficiales
Puedes dar de alta oficiales y, si el torneo lo requiere, asociarlos a pista.

### 10.2 Asignación por pista
Cuando la opción está activada:
- cada oficial trabaja sobre su pista asignada
- se mejora el control operativo del acta digital

---

## 11. Información pública y material gráfico

En la información del torneo puedes gestionar:
- información general
- reglas
- contacto
- ubicación
- cartel del evento
- cartel de cafetería
- imagen de patrocinadores
- logotipos de cabecera y fondo

Esto alimenta tanto administración como visualización pública.

---

## 12. Atajos de teclado

La administración incorpora navegación rápida con teclas de función.

Atajos principales:
- `F1`: Equipos
- `F2`: Competición
- `F3`: Partidos
- `F4`: Clasificación
- `F6`: Torneos
- `F7`: Categorías
- `F8`: Calendario
- `F10`: Oficiales
- `F11`: Registro / logs
- `F12`: Información

Además:
- en monitor y acta digital, `F4` activa o desactiva pantalla completa

---

## 13. Recomendaciones operativas

- Configura primero jornadas y pistas antes de generar calendario.
- Si cambias reglas de descanso o disponibilidad, regenera el calendario.
- Usa clonación de torneos para ahorrar tiempo entre ediciones.
- Revisa el monitor y el portal público tras cambios importantes.
- Evita editar estructura de competición cuando ya existan resultados confirmados.

---

> Consejo práctico: para una nueva edición anual, lo más eficiente suele ser clonar el torneo anterior, revisar jornadas, ajustar pistas y regenerar la estructura competitiva con los equipos nuevos.
