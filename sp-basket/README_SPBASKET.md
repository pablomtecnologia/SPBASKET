# 🏀 SP Basket - Aplicación Angular

Aplicación web completa desarrollada en **Angular 19** para el club de baloncesto femenino **SP Basket** de Santa Cruz de Bezana, Cantabria.

## 📋 Características

### ✨ Diseño y Estilo
- **Colores corporativos**: Rosa neón (#E6007E) como color principal
- **Tipografía**: Montserrat (Google Fonts)
- **Diseño responsive**: Adaptado para móvil, tablet y desktop
- **Animaciones**: Efectos hover, transiciones suaves y animaciones CSS
- **Tema moderno**: Gradientes, sombras y efectos glassmorphism

### 📄 Páginas Implementadas

1. **Home (Corazón Rosa)**
   - Hero section con logo animado
   - Sección de redes sociales destacada
   - Grid de características del club
   - Call-to-action para contacto

2. **Equipos**
   - Grid de todos los equipos del club
   - Información de categorías (Senior, Juvenil, Cadete, Infantil, Mini)
   - Estadísticas de jugadores y entrenadores
   - Cards con diseño atractivo

3. **Competiciones**
   - Calendarios de partidos
   - Próximos encuentros
   - Estadísticas de victorias y derrotas
   - Información por equipo

4. **Noticias**
   - Grid de noticias recientes
   - Extractos de artículos
   - Fechas de publicación
   - Enlaces a artículos completos

5. **Documentación**
   - Recursos descargables
   - Protocolos y normativas
   - Documentos administrativos
   - Información sobre seguros

6. **Contacto**
   - Formulario funcional con validación
   - Información de contacto
   - Mapa de ubicación (Google Maps)
   - Enlaces a redes sociales
   - Horarios de atención

7. **Galería**
   - Grid de imágenes
   - Enlace a Flickr
   - Overlay con información
   - Efectos hover

8. **Productos**
   - Merchandising oficial
   - Precios y disponibilidad
   - Badges de "Nuevo" y "Próximamente"
   - Sistema de compra

### 🎨 Componentes

- **Header**: Navegación sticky con logo y menú responsive
- **Footer**: Información de contacto, redes sociales y colaboradores
- **Mobile Menu**: Menú hamburguesa para dispositivos móviles

## 🚀 Instalación y Uso

### Requisitos Previos
- Node.js (v18 o superior)
- npm (v9 o superior)
- Angular CLI (v19)

### Instalación

```bash
# Navegar al directorio del proyecto
cd sp-basket

# Instalar dependencias
npm install
```

### Desarrollo

```bash
# Iniciar servidor de desarrollo
npm start

# O especificar un puerto diferente
ng serve --port 4201
```

La aplicación estará disponible en `http://localhost:4200` (o el puerto especificado).

### Compilación para Producción

```bash
# Compilar para producción
npm run build

# Los archivos compilados estarán en dist/sp-basket/
```

## 📁 Estructura del Proyecto

```
sp-basket/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── header/          # Componente de cabecera
│   │   │   └── footer/          # Componente de pie de página
│   │   ├── pages/
│   │   │   ├── home/            # Página principal
│   │   │   ├── equipos/         # Página de equipos
│   │   │   ├── competiciones/   # Página de competiciones
│   │   │   ├── noticias/        # Página de noticias
│   │   │   ├── documentacion/   # Página de documentación
│   │   │   ├── contacto/        # Página de contacto
│   │   │   ├── galeria/         # Página de galería
│   │   │   └── productos/       # Página de productos
│   │   ├── app.ts               # Componente raíz
│   │   ├── app.routes.ts        # Configuración de rutas
│   │   └── app.config.ts        # Configuración de la app
│   ├── styles.css               # Estilos globales
│   ├── index.html               # HTML principal
│   └── main.ts                  # Punto de entrada
├── public/                      # Archivos estáticos
├── angular.json                 # Configuración de Angular
├── package.json                 # Dependencias del proyecto
└── tsconfig.json               # Configuración de TypeScript
```

## 🎨 Sistema de Diseño

### Colores
```css
--primary-pink: #E6007E;        /* Rosa principal */
--primary-pink-dark: #C0006A;   /* Rosa oscuro */
--primary-pink-light: #FF1A94;  /* Rosa claro */
--dark-bg: #1a1a1a;             /* Fondo oscuro */
--white: #ffffff;               /* Blanco */
```

### Espaciado
```css
--spacing-xs: 0.5rem;   /* 8px */
--spacing-sm: 1rem;     /* 16px */
--spacing-md: 2rem;     /* 32px */
--spacing-lg: 3rem;     /* 48px */
--spacing-xl: 4rem;     /* 64px */
```

### Bordes
```css
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 16px;
--radius-full: 50%;
```

## 📱 Responsive Design

- **Desktop**: > 1024px
- **Tablet**: 768px - 1024px
- **Mobile**: < 768px

El diseño se adapta automáticamente a diferentes tamaños de pantalla con:
- Grid responsive
- Menú hamburguesa en móvil
- Imágenes adaptativas
- Tipografía escalable

## 🔧 Tecnologías Utilizadas

- **Angular 19**: Framework principal
- **TypeScript**: Lenguaje de programación
- **CSS3**: Estilos y animaciones
- **Google Fonts**: Tipografía Montserrat
- **Angular Router**: Navegación entre páginas
- **Angular Forms**: Formularios reactivos

## 📧 Contacto

**SP Basket**
- Email: cb.spbasket@gmail.com
- Ubicación: Pabellón Municipal, Santa Cruz de Bezana, Cantabria
- Redes Sociales: Facebook, Instagram, Twitter, TikTok, Twitch

## 🏆 Colaboradores

- Fundación la Caixa
- Ayuntamiento de Santa Cruz de Bezana
- Grupo Santa Cruz de Bezana

## 📝 Licencia

© 2025 SPBasket. Todos los derechos reservados.

---

**Desarrollado con ❤️ y 🏀 para SP Basket**
