# Plan de Implementación: Automatización de Fase Eliminatoria 🏀

El objetivo es que los equipos se muevan automáticamente a sus posiciones en el cuadro de eliminatorias tan pronto como termine su grupo correspondiente, sin esperar a que terminen todos los grupos de la categoría.

## 1. Correcciones de Errores Actuales 🐛
- En `backend/src/index.js`, la función `refreshCategoryBrackets` intenta usar una variable `teams` que no ha sido definida. Se añadirá la consulta necesaria.

## 2. Refactorización de Lógica de Grupos 🔄
- Modificar `refreshCategoryBrackets` para que no use un interruptor global `isGroupsFinished`.
- Implementar una función auxiliar `isGroupFinished(groupName)` que verifique si todos los partidos de la ronda 1 de un grupo específico han terminado.
- Actualizar `getTeamByRank(groupName, rank)` para que devuelva el equipo si su grupo específico ha terminado, independientemente del estado de otros grupos.

## 3. Actualización de Cruces (Brackets) 🏟️
- Ampliar la lógica de `refreshCategoryBrackets` para cubrir todos los casos de equipos (8, 9, 10, 11, 12, 13-14, 15-19, 20) tal como se definen en `generateFinalPhaseBrackets`.
- Asegurar que la actualización en la base de datos sea inteligente: solo actualizar `homeTeamId` o `awayTeamId` si el equipo correspondiente ya está determinado (no es `null`), para evitar sobreescrituras innecesarias con `null`.

## 4. Propagación de Resultados ⚡
- Mantener la lógica de propagación de ganadores (Octavos -> Cuartos -> Semis -> Final) que ya existe, asegurando que funcione en cascada.

## Pasos de ejecución:
1.  Modificar `backend/src/index.js`.
2.  Verificar que `getDetailedStandings` funcione correctamente para rankings por grupo.
3.  Probar con un escenario de 8 equipos (2 grupos) terminando uno de ellos.
