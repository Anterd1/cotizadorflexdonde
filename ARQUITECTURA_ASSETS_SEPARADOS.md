# Arquitectura con Assets Separados

## ✅ Implementación Profesional Completada

Se ha reestructurado el cotizador siguiendo las mejores prácticas de Shopify.

## Estructura de Archivos

```
extensions/cotizador/
├── assets/
│   ├── cotizador.css          (11 KB) - Estilos completos
│   ├── cotizador.js           (10 KB) - Lógica de la aplicación
│   └── thumbs-up.png          (Existente)
├── blocks/
│   ├── cotizador.liquid       (3 KB) - HTML y configuración ✅
│   ├── cotizador-backup.liquid (Backup de versión anterior)
│   └── star_rating.liquid     (Existente)
└── shopify.extension.toml
```

## Ventajas de Esta Arquitectura

### 1. Cumple Límites de Shopify
- ✅ Liquid: 3 KB (límite: 100 KB)
- ✅ CSS: 11 KB (sin límite)
- ✅ JS: 10 KB (sin límite)

### 2. Mejor Rendimiento
- ✅ Navegador cachea CSS y JS
- ✅ Carga paralela de recursos
- ✅ No re-procesa código en cada carga

### 3. Mantenibilidad
- ✅ Código separado por responsabilidad
- ✅ Fácil de encontrar y modificar
- ✅ Git muestra cambios claros
- ✅ Múltiples desarrolladores pueden trabajar

### 4. Escalabilidad
- ✅ Agregar funcionalidades sin límites
- ✅ Agregar bibliotecas externas si es necesario
- ✅ Fácil de extender

### 5. Debugging
- ✅ Errores muestran línea exacta del archivo
- ✅ Source maps funcionan mejor
- ✅ Console más clara

## Archivos Detallados

### `assets/cotizador.css`

**Contenido:**
- Variables CSS (configurables desde el tema)
- Estilos de categorías y navegación
- Diseño de 3 paneles
- Controles de pago
- Formulario de contacto
- Modal
- Media queries responsive

**Variables CSS:**
```css
--cotizador-button-color: #3498db
--cotizador-button-text-color: #ffffff
--cotizador-border-color: #dddddd
--cotizador-title-size: 32px
... etc
```

### `assets/cotizador.js`

**Contenido:**
- Clase `CotizadorApp` (arquitectura orientada a objetos)
- Métodos para interactuar con API
- Manejo de estado
- Event listeners
- Actualización dinámica de UI

**Métodos principales:**
- `selectCategory()` - Seleccionar categoría de producto
- `loadCatalog()` - Cargar catálogo desde API
- `calculateAndShowResults()` - Calcular precio y mostrar resultados
- `selectPlan()` - Cambiar entre Tradicional/Fijo
- `updatePaymentSummary()` - Actualizar montos en tiempo real
- `showContactForm()` - Mostrar formulario final
- `handleSubmit()` - Enviar cotización

### `blocks/cotizador.liquid`

**Contenido:**
- Carga de assets (CSS y JS)
- HTML semántico y limpio
- Variables CSS inline (desde configuración del tema)
- Schema de configuración
- Inicialización del JavaScript

**Tamaño:** 3 KB ✅

## Cómo Funciona

### 1. Carga de Recursos

```liquid
{{ 'cotizador.css' | asset_url | stylesheet_tag }}
```
- Shopify resuelve la URL del asset
- Agrega el CSS al head del documento
- Navegador lo cachea

```liquid
<script src="{{ 'cotizador.js' | asset_url }}" defer></script>
```
- Carga asíncrona del JavaScript
- `defer` asegura que el DOM esté listo
- No bloquea el renderizado de la página

### 2. Configuración Dinámica

```liquid
<div style="
  --cotizador-button-color: {{ block.settings.button_color }};
  --cotizador-title-size: {{ block.settings.title_size }}px;
  ...
">
```

Las variables CSS se configuran desde el editor de temas y se inyectan inline.

### 3. Inicialización

```javascript
new CotizadorApp('{{ block.id }}', {
  shop: '{{ shop.permanent_domain }}'
});
```

- Crea instancia única por bloque
- Permite múltiples bloques en la misma página
- Aislamiento de estado

## Modificaciones Futuras

### Para cambiar estilos:
Edita solo `assets/cotizador.css`

### Para cambiar funcionalidad:
Edita solo `assets/cotizador.js`

### Para cambiar estructura HTML:
Edita solo `blocks/cotizador.liquid`

### Para agregar configuraciones:
Agrega settings en el `{% schema %}` de `cotizador.liquid`

## Deploy

```bash
cd /Users/mac/cotizadorv3/cotizadorv3
shopify app deploy
```

Shopify automáticamente:
1. Sube los assets a su CDN
2. Optimiza y comprime los archivos
3. Los hace disponibles globalmente
4. Activa caché del navegador

## Testing

Después del deploy:
1. Ve al editor de temas
2. Actualiza el preview
3. Recarga con Cmd + Shift + R
4. Abre F12 → Console
5. Prueba seleccionando productos

## Beneficios Inmediatos

✅ **No más error de 100 KB**  
✅ **Código profesional y mantenible**  
✅ **Fácil de modificar diseño**  
✅ **Preparado para crecer**  
✅ **Mejor rendimiento**  
✅ **Caché del navegador**

## Próximos Pasos

1. Deploy para aplicar cambios
2. Validar funcionalidad completa
3. Iterar sobre diseño según feedback
4. Agregar funcionalidades adicionales sin preocupación por límites

## Rollback (si es necesario)

Si necesitas volver a la versión anterior:

```bash
cp extensions/cotizador/blocks/cotizador-backup.liquid extensions/cotizador/blocks/cotizador.liquid
```

Luego vuelve a hacer deploy.

