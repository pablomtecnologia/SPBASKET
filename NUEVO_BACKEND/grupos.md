# Lógica de Generación de Grupos y Eliminatorias 🏀🏆

Este documento detalla cómo el sistema organiza automáticamente los equipos en grupos y define los cruces de la fase final basándose en el número total de inscritos por categoría.

## 📋 Resumen por Número de Equipos

| Equipos | Estructura de Grupos | Fase Final | Sistema de Clasificación |
| :--- | :--- | :--- | :--- |
| **4** | 1 Grupo de 4 | Semis + Final | 1º vs 4º, 2º vs 3º |
| **5 - 7** | 1 Grupo único | Final directa | 1º vs 2º |
| **8 - 9** | 2 Grupos (4-4 o 5-4) | Cuartos + Semis + Final | 1ºA vs 4ºB, 1ºB vs 4ºA, 2ºA vs 3ºB, 2ºB vs 3ºA |
| **10 - 11** | 2 Grupos (5-5 o 6-5) | Final directa | 1ºA vs 1ºB |
| **12 - 15** | 3 Grupos | Octavos (Cuadro de 16) | Ranking global (Seed). Algunos equipos tienen BYE. |
| **16 - 17** | 4 Grupos | Octavos completos | Los 4 mejores de cada grupo se cruzan (A1-D4, B2-C3, etc.) |
| **18** | 3 Grupos de 6 | Semis + Final | 1ºs de cada grupo + Mejor 2º |
| **19** | 1 de 7 + 2 de 6 | Semis + Final | 1ºs de cada grupo + **2º del Grupo A** |
| **20** | 4 Grupos de 5 | Semis + Final | 1º de cada grupo (A, B, C, D) |
| **21** | 1 de 6 + 3 de 5 | Semis + Final | 1º de cada grupo (A, B, C, D) |
| **22** | 2 de 6 + 2 de 5 | Semis + Final | 1º de cada grupo (A, B, C, D) |
| **24** | 4 Grupos de 6 | Semis + Final | 1º de cada grupo (A, B, C, D) |

---

## 🛠️ Detalles Técnicos de Implementación

### 1. División de Grupos (`scheduler.js`)
La función `splitIntoGroups(teams)` mezcla los equipos aleatoriamente antes de asignarlos para garantizar la imparcialidad. Los repartos están optimizados para que el número de partidos por equipo sea equilibrado.

### 2. Generación de Fase Final (`index.js`)
La función `generateFinalPhaseBrackets(categoryId)` se encarga de crear los partidos de eliminatorias una vez que la fase de grupos ha finalizado (`status: 'played'`).
- **Respeto a la Integridad**: El sistema impide regenerar la fase final si ya hay resultados introducidos en las eliminatorias.
- **Identificación Automática**: El sistema detecta si la liga ha terminado antes de permitir la generación de los cruces.

### 3. Clasificación Dinámica (`index.js`)
La función `refreshCategoryBrackets(categoryId)` monitoriza los resultados de la fase de grupos. En cuanto un grupo termina, el sistema:
1. Calcula el ranking del grupo (Victorias > Diferencia de Puntos > Puntos Favor).
2. Propaga automáticamente el ID del equipo al partido de la fase final correspondiente (ej: El ganador del Grupo A se coloca en "Semifinal 1").
3. Si un equipo gana una semifinal, se propaga automáticamente a la Final.

---
*SPBASKET 3x3 — Documentación de Lógica de Competición* 🐧🏀
