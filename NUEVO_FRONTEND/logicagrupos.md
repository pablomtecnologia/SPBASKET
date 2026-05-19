# Lógica de Grupos y Cuadros Finales

Este documento resume la lógica actual implementada en el proyecto para:

- repartir equipos en grupos
- generar partidos de fase de grupos
- crear el cuadro final según el número de equipos de una categoría

La referencia real está en:

- [backend/src/services/scheduler.js](C:/Users/jamayuelas/OneDrive%20-%20ELMUBAS%20IBERICA,%20SLU/Documentos/Personal/IA/Antigravity/spbasket-3x3/backend/src/services/scheduler.js)
- [backend/src/index.js](C:/Users/jamayuelas/OneDrive%20-%20ELMUBAS%20IBERICA,%20SLU/Documentos/Personal/IA/Antigravity/spbasket-3x3/backend/src/index.js)

## 1. Reparto en grupos

Antes de asignar grupos, los equipos se mezclan aleatoriamente.

Después se reparten así:

| Nº equipos | Grupos |
|---|---|
| 1-7 | 1 grupo: A |
| 8 | A(4), B(4) |
| 9 | A(5), B(4) |
| 10 | A(5), B(5) |
| 11 | A(6), B(5) |
| 12 | A(4), B(4), C(4) |
| 13 | A(5), B(4), C(4) |
| 14 | A(5), B(5), C(4) |
| 15 | A(5), B(5), C(5) |
| 16 | A(4), B(4), C(4), D(4) |
| 17 | A(5), B(4), C(4), D(4) |
| 18 | A(6), B(6), C(6) |
| 19 | A(7), B(6), C(6) |
| 20 | A(5), B(5), C(5), D(5) |
| 21 | A(6), B(5), C(5), D(5) |
| 22 | A(6), B(6), C(5), D(5) |
| 23 | A(6), B(6), C(6), D(5) |
| 24 | A(6), B(6), C(6), D(6) |

Si el número no entra en esos casos, el sistema hace fallback a un único `Grupo A`.

## 2. Partidos de fase de grupos

Dentro de cada grupo se genera una liga todos contra todos.

Regla:

- cada equipo juega contra todos los demás de su grupo una vez
- todos esos partidos se crean con:
  - `round = 1`
  - `status = pending`
  - `group = Grupo X`

## 3. Criterio de clasificación

Para calcular clasificados y cruces, el sistema usa la clasificación detallada por grupo.

El orden se resuelve por:

1. más victorias
2. mejor diferencia de puntos
3. más puntos a favor

## 4. Cuadro final por número de equipos

## 4.1. 3 equipos

- 1 grupo de 3
- fase de grupos a doble vuelta
- cada pareja de equipos juega 2 partidos
- pasan a la final los 2 primeros clasificados

Cruce:

- Final: 1º A vs 2º A

En total:

- 6 partidos de grupo
- 1 final

## 4.2. 4 equipos

- 1 grupo de 4
- pasan los 4
- cruces:
  - Semifinal 1: 1º A vs 4º A
  - Semifinal 2: 2º A vs 3º A
  - Final: ganador SF1 vs ganador SF2

## 4.3. 5 a 7 equipos

- 1 grupo
- final directa:
  - Final: 1º A vs 2º A

## 4.4. 8 o 9 equipos

- 2 grupos
- entran 4 equipos por grupo
- cruces:
  - Cuartos 1: 1º A vs 4º B
  - Cuartos 2: 2º B vs 3º A
  - Cuartos 3: 2º A vs 3º B
  - Cuartos 4: 1º B vs 4º A
  - Semifinal 1: ganador C1 vs ganador C3
  - Semifinal 2: ganador C2 vs ganador C4
  - Final: ganador SF1 vs ganador SF2

## 4.5. 10 u 11 equipos

- 2 grupos
- final directa:
  - Final: 1º A vs 1º B

## 4.6. 12 a 14 equipos

- el sistema genera cuadro de 16
- usa ranking global de clasificación
- los seeds sin rival quedan como `BYE` implícito

Cruces iniciales:

- Octavos 1: 1 vs 16
- Octavos 2: 8 vs 9
- Octavos 3: 4 vs 13
- Octavos 4: 5 vs 12
- Octavos 5: 2 vs 15
- Octavos 6: 7 vs 10
- Octavos 7: 3 vs 14
- Octavos 8: 6 vs 11

Después:

- Cuartos 1: ganador O1 vs ganador O2
- Cuartos 2: ganador O3 vs ganador O4
- Cuartos 3: ganador O5 vs ganador O6
- Cuartos 4: ganador O7 vs ganador O8
- Semifinal 1: ganador C1 vs ganador C4
- Semifinal 2: ganador C2 vs ganador C3
- Final: ganador SF1 vs ganador SF2

## 4.7. 15 a 18 equipos

- 3 grupos
- pasan:
  - los 3 primeros de grupo
  - el mejor segundo

Cruces:

- Semifinal 1: 1º A vs mejor 2º
- Semifinal 2: 1º B vs 1º C
- Final: ganador SF1 vs ganador SF2

## 4.8. 16 o 17 equipos

- 4 grupos
- pasan 4 por grupo
- cuadro completo de octavos

Cruces:

- Octavos 1: 1º A vs 4º D
- Octavos 2: 2º B vs 3º C
- Octavos 3: 1º B vs 4º A
- Octavos 4: 2º C vs 3º D
- Octavos 5: 1º C vs 4º B
- Octavos 6: 2º D vs 3º A
- Octavos 7: 1º D vs 4º C
- Octavos 8: 2º A vs 3º B

Después:

- Cuartos 1: ganador O1 vs ganador O2
- Cuartos 2: ganador O3 vs ganador O4
- Cuartos 3: ganador O5 vs ganador O6
- Cuartos 4: ganador O7 vs ganador O8
- Semifinal 1: ganador C1 vs ganador C2
- Semifinal 2: ganador C3 vs ganador C4
- Final: ganador SF1 vs ganador SF2

## 4.9. 19 equipos

- 3 grupos: A(7), B(6), C(6)
- pasan:
  - 1º A
  - 1º B
  - 1º C
  - 2º A

Cruces:

- Semifinal 1: 1º A vs 1º C
- Semifinal 2: 1º B vs 2º A
- Final: ganador SF1 vs ganador SF2

## 4.10. 20 a 24 equipos

- 4 grupos
- pasan solo los primeros de cada grupo

Cruces:

- Semifinal 1: 1º A vs 1º D
- Semifinal 2: 1º B vs 1º C
- Final: ganador SF1 vs ganador SF2

Nota:

- en la propagación de cruces automáticos, el código contempla explícitamente `20`, `21`, `22` y `24`
- `23` sí tiene reparto de grupos, pero no aparece cubierto en la actualización posterior del cuadro final, así que conviene revisarlo si se va a usar

## 5. Cuándo se asignan los equipos a eliminatorias

La estructura del cuadro se puede crear aunque la fase de grupos no haya terminado.

Mientras no estén cerrados los partidos necesarios:

- los huecos pueden quedar en `null`
- los partidos eliminatorios existen pero sin equipos definitivos

Cuando avanza la competición:

- el sistema recalcula clasificados
- propaga ganadores a la siguiente ronda
- actualiza finales, semis, cuartos y octavos según proceda

## 6. Reglas importantes de actualización

- Si un partido eliminatorio ya está jugado, el sistema evita resetearlo automáticamente si cambian clasificados después.
- Al regenerar la fase final de una categoría, primero se borran:
  - los `scheduleSlots` de rondas `>= 2`
  - los partidos de rondas `>= 2`

## 7. Observación importante

La lógica documentada aquí es la lógica actualmente programada, no una normativa externa.

Eso significa que:

- algunos tamaños priorizan final directa
- otros usan semifinales
- otros generan cuadro de 16 aunque haya menos de 16 equipos

Si quieres, en el siguiente paso puedo prepararte una segunda versión del documento con formato más “de negocio”, en lenguaje menos técnico y con ejemplos visuales por cada número de equipos.
