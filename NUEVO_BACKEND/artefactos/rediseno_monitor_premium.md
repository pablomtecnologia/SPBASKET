# Rediseño Premium del Monitor TV (Stitch Style) 📺💎

He aplicado una transformación estética profunda al Monitor de TV para que tenga un aspecto "WOW" y profesional, siguiendo las mejores prácticas de diseño moderno y utilizando una lógica de auto-escalado inteligente.

## 🎨 Mejoras Estéticas (Stitch Philosophy)
- **Glassmorphism & Profundidad**: Fondo con gradientes de malla profundos (`#020617` con acentos azules y púrpuras) y tarjetas con efecto de cristal esmerilado (`backdrop-filter`).
- **Tipografía Moderna**: Uso de pesos extremos (900-950) para marcadores y títulos, creando un contraste visual potente.
- **Iluminación de Neón**: Los marcadores y las tarjetas activas tienen un resplandor dinámico (`text-shadow` y `box-shadow`) que cambia según el color de la categoría.
- **Micro-animaciones**:
  - `active-float`: Los partidos activos flotan suavemente.
  - `live-indicator`: Un indicador parpadeante para partidos en curso.
  - `slide-in`: Entrada suave de nuevas tarjetas.

## 📏 Auto-escalado Inteligente
Para cumplir con el requisito de que todos los partidos quepan en sus respectivas columnas:
1. **Lógica de Escalado**: Se ha implementado la función `getScaleClass` que monitoriza el número de partidos.
2. **Tres Niveles de Densidad**:
   - **Normal**: Para pocos partidos, con marcadores gigantes (5rem) y espaciado amplio.
   - **Compacto**: (> 8 partidos) Reduce tamaños de fuente y paddings.
   - **Mini**: (> 12 partidos) Optimiza al máximo el espacio para asegurar la visibilidad de todas las rondas sin scroll excesivo.
3. **Control por CSS Variables**: Los colores de acento se manejan mediante `--accent-color` inyectado desde React, asegurando coherencia total con las categorías.

## 🏗️ Estructura de Columnas
- **Izquierda (En Juego)**: Agrupación por ronda con encabezados elegantes. Indicador de "LIVE" y glow dinámico.
- **Derecha (Próximos)**: Lista optimizada de las siguientes 2 rondas con formato de emparejamiento claro.

---
**Resultado**: Un monitor digno de una competición profesional de élite. 🏀🔥✨
