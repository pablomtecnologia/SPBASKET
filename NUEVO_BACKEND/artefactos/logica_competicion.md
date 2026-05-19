# 🏀 Lógica de Competición - SPBASKET 3x3

Este documento detalla cómo el sistema organiza los grupos y las fases finales dependiendo del número de equipos inscritos en una categoría.

---

## 📋 Resumen de Estructura por Número de Equipos

| Equipos | Grupos | Distribución | Fase Final |
| :--- | :--- | :--- | :--- |
| **4** | 1 | 4 equipos | Semifinales (1º vs 4º, 2º vs 3º) |
| **5 - 7** | 1 | 5-7 equipos | Final Directa (1º vs 2º) |
| **8** | 2 | 4 + 4 | Cuartos de Final (Cruces A1-B4, B2-A3, A2-B3, B1-A4) |
| **9** | 2 | 5 + 4 | Cuartos de Final (Cruces A1-B4, B2-A3, A2-B3, B1-A4) |
| **10 - 11** | 2 | 5+5 o 6+5 | Final Directa (Ganador A vs Ganador B) |
| **12 - 14** | 3 | 4+4+4 o 5+4+4 | Cuadro de 16 (Octavos con BYEs por ranking general) |
| **15** | 3 | 5 + 5 + 5 | Semifinales (3 ganadores + Mejor 2º) |
| **16** | 4 | 4 + 4 + 4 + 4 | Octavos de Final (4 primeros de cada grupo cruzados) |
| **17** | 4 | 5 + 4 + 4 + 4 | Octavos de Final (4 primeros de cada grupo cruzados) |
| **18** | 3 | 6 + 6 + 6 | Semifinales (3 ganadores + Mejor 2º) |
| **19** | 3 | 7 + 6 + 6 | Semifinales (A1 vs C1, B1 vs A2) |
| **20** | 4 | 5 + 5 + 5 + 5 | Semifinales (Ganadores A, B, C, D) |
| **21** | 4 | 6 + 5 + 5 + 5 | Semifinales (Ganadores A, B, C, D) |
| **22** | 4 | 6 + 6 + 5 + 5 | Semifinales (Ganadores A, B, C, D) |
| **23** | 4 | 6 + 6 + 6 + 5 | Semifinales (Ganadores A, B, C, D) |
| **24** | 4 | 6 + 6 + 6 + 6 | Semifinales (Ganadores A, B, C, D) |

---

## 🛠️ Detalles de la Lógica

### 1. Fase de Grupos (Round Robin)
*   Los equipos se mezclan aleatoriamente antes de ser asignados a los grupos.
*   En cada grupo se juega una liga de todos contra todos a una sola vuelta.

### 2. Fase Final (Eliminatorias)
*   **Ranking General**: Para casos como el de 12-14 equipos, se genera un ranking basado en victorias y diferencia de puntos para asignar los "seeds" del 1 al 16.
*   **Cruces de Grupos**: 
    *   Cuando hay **2 grupos** y pasan a Cuartos, se cruzan 1º de un grupo con el 4º del otro, y 2º con 3º.
    *   Cuando hay **4 grupos** y pasan a Octavos (16-17 equipos), se maximiza la variedad cruzando equipos de los 4 grupos (ej. A1 vs D4).
    *   Cuando pasan **solo los ganadores** (20-24 equipos), las semis son A1 vs D1 y B1 vs C1.

### 3. Criterios de Desempate (Ranking)
1.  **Victorias** (Wins).
2.  **Diferencia de Puntos** (Points Difference).
3.  **Puntos a Favor** (Points For).

---

> **Nota**: Si una categoría tiene menos de 4 equipos, el sistema generará un grupo único pero la fase final puede requerir ajustes manuales o ser una final directa dependiendo de la configuración.
