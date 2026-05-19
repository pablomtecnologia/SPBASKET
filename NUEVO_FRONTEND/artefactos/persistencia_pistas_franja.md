# Preservación de la Disponibilidad de Pistas-Franja 🏀✨

### 📌 Problema
Cuando el usuario editaba la información general del torneo y sus "franjas horarias" (Jornadas), el backend eliminaba las `Jornadas` previas y creaba unas nuevas. Al utilizar Prisma con un borrado en cascada (Cascade Delete), también se perdían todas las configuraciones de pistas de cada jornada (`JornadaCourtConfig`) definidas por el usuario, por lo que las pistas volvían a estar abiertas para todas las categorías por defecto.

### 🛠️ Solución
Se modificó la transacción de actualización de torneos (`PUT /api/tournaments/:id`) en `backend/src/index.js` para realizar las siguientes acciones antes de recrear las jornadas:

1. **Lectura Previa**: Guardar en memoria las `Jornadas` antiguas junto con sus `JornadaCourtConfig` asociados.
2. **Recreación**: Dejar que la actualización proceda con la creación de las nuevas jornadas.
3. **Mapeo Inteligente**: Recorrer las nuevas jornadas y asociarlas con las antiguas. La comparación se hace priorizando igualdad de `date` y `startTime` para asegurar que migramos al "mismo bloque" temporal.
4. **Restauración en Cascada**: Una vez mapeada la jornada nueva con la antigua, se insertan de nuevo los registros `JornadaCourtConfig` para que todas las restricciones de categoría (categorías conectadas a una pista en una hora concreta) se vuelvan a guardar en la base de datos automáticamente.

¡Problema resuelto, horas reajustables sin dolor! 🎯
