# Plan: Reestructuración de Grupos y Eliminatorias (N = 7, 8, 9, 10) 🏀📊

## Resumen del Cambio
Se ajustarán las reglas de partición de grupos para ciertas cantidades de equipos y se reescribirá la generación del cuadro de honor (eliminatorias), reduciendo drásticamente las rondas en las categorías con 8, 9 y 10 equipos.

## Propuesta de Cambios

### Lógica de partición de Grupos (`backend/src/services/scheduler.js`)
#### [MODIFY] `scheduler.js`
- **N = 7**: Se levanta la restricción (excepción). Pasará a la condición de `N <= 7`, es decir, se generará **1 Único Grupo (Todos contra todos)**.
- **N = 8**: Se mantiene igual (2 grupos de 4).
- **N = 9**: Se distribuirá en **2 Grupos** (Grupo A con 5 equipos, Grupo B con 4 equipos) en lugar de la anterior lógica (3 grupos de 3).
- **N = 10**: Se distribuirá en **2 Grupos** de 5 equipos, reemplazando la anterior (3 grupos de 3 y 4).

### Lógica de Cuadro Final (`backend/src/index.js`)
#### [MODIFY] `index.js` (Función `generateFinalPhaseBrackets`)
- **Para N = 7**: El código actual ya ignora fases finales para N=5 y N=6. Simplemente aplicará la misma regla para N=7 (no ejecuta cuadros posteriores, clasificación directa por liga).
- **Para N = 8, 9 y 10**: 
  - Se eliminan por completo los cruces de Cuartos de Final y Semifinales.
  - Se insertará exclusivamente **un único partido** (La Final) que cruzará al `Rank 1 del Grupo A` contra el `Rank 1 del Grupo B`.
