# Implementación de Lógica para 13 Equipos (5, 4, 4) 🏀🏀🏀

Este plan detalla los cambios necesarios para soportar una categoría con 13 equipos, organizándolos en 3 grupos y definiendo una fase final donde todos pasan a Octavos, pero los líderes de cada grupo avanzan directamente a Cuartos por BYE.

## Propuesta de Cambios

### ⚙️ Backend
- **scheduler.js**: Confirmada división 5, 4, 4.
- **index.js**: Nuevo caso `n === 13` en `generateFinalPhaseBrackets` y `refreshCategoryBrackets`.

### Cruces de Octavos (Propuesta):
1. A2 vs C4
2. B2 vs A5
3. C2 vs B4
4. A3 vs C3
5. B3 vs A4

### Cuartos de Final (Propuesta):
- A1 vs Ganador M1
- B1 vs Ganador M2
- C1 vs Ganador M3
- Ganador M4 vs Ganador M5

---
*Documento registrado para seguimiento.* 🏀🏀🏀
