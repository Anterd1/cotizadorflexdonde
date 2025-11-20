# Formulario del Storefront con Catálogos de API

El bloque del tema ahora incluye integración directa con la API de Catálogos, permitiendo a los clientes seleccionar productos específicos.

## Características

### 1. Selección de Productos por Categoría

El formulario ahora tiene 4 categorías principales:

- **💰 Metales**: Oro y Plata (con cálculo de precio por peso)
- **💎 Diamantes**: Selección de Color → Claridad → Tamaño
- **📱 Electrónicos**: Categoría → Marca → Modelo → Características
- **🚗 Vehículos**: Tipo → Año → Marca → Modelo → Versión

### 2. Flujo de Usuario

1. El cliente hace clic en una categoría (ej: "💰 Metales")
2. Se muestra el catálogo correspondiente
3. El cliente navega por los niveles del catálogo seleccionando opciones
4. Al completar la selección, se calcula automáticamente el precio
5. El producto se agrega a la lista de "Productos Seleccionados"
6. **NUEVO:** Se cargan automáticamente las opciones de préstamo
7. **NUEVO:** El cliente puede seleccionar una opción de préstamo (frecuencia y términos)
8. El cliente puede agregar más productos o completar el formulario
9. Al enviar, se crea una cotización con todos los productos seleccionados y la opción de préstamo elegida

### 3. Navegación de Catálogos

**Breadcrumb:**
- Muestra la ruta de selección actual
- Botón "← Volver al inicio" para reiniciar la selección

**Productos Seleccionados:**
- Se muestran como etiquetas con el nombre y precio
- Botón "×" para eliminar cada producto

### 4. Campos del Formulario

**Campos obligatorios:**
- Nombre completo
- Email

**Campos opcionales:**
- Teléfono
- Mensaje adicional

### 5. Líneas de Préstamo

Después de calcular el precio, se muestran automáticamente:

**Productos de Préstamo:**
- **Tradicional**: Con interés tradicional
- **Pagos Fijos**: Con cuotas fijas

**Frecuencias:**
- Diario
- Semanal
- Catorcenal
- Mensual

**Términos:**
- 1 pago, 6 pagos, 12 pagos, etc.
- Cada término muestra:
  - Monto del pago
  - Monto del último pago
  - Pago preferente (si aplica)

El cliente puede seleccionar una opción haciendo clic en ella. La opción seleccionada se envía junto con la cotización.

### 6. Datos Enviados al Backend

El formulario envía:
```json
{
  "customerName": "Juan Pérez",
  "customerEmail": "juan@email.com",
  "customerPhone": "123-456-7890",
  "message": "Información adicional",
  "selectedProducts": "[{\"name\":\"...\",\"price\":123,\"category\":\"...\",\"path\":[...]}]",
  "selectedLoan": "{\"product\":\"Tradicional\",\"frequency\":\"Mensual\",\"term\":{...}}",
  "shop": "tienda.myshopify.com",
  "source": "storefront"
}
```

## Integración con la API

### Configuración

La API se consume directamente desde el JavaScript del bloque:

```javascript
const API_URL = 'https://grzdgd2zck.execute-api.us-east-1.amazonaws.com/dev';
const API_KEY = 'fwd3BEJbH33ZPv1jTQ0aX8dC80nnsavR2m7pSNRu';
```

### Endpoints Utilizados

1. **`/simulator/catalog`** (POST)
   - Catálogos de metales, diamantes y electrónicos

2. **`/simulator/catalog-ext`** (POST)
   - Catálogos de vehículos

3. **`/simulator/price`** (POST)
   - Cálculo de precios

## Personalización desde el Editor de Temas

Todas las configuraciones visuales se pueden editar desde el editor de temas de Shopify:

- Título y descripción
- Colores (botones, bordes, etiquetas)
- Tamaños de fuente
- Padding y espaciado
- Mensajes de éxito y error
- Textos de etiquetas y placeholders

## Debugging

El formulario incluye logs detallados en la consola del navegador. Para ver los logs:

1. Abre las herramientas de desarrollador (F12)
2. Ve a la pestaña "Console"
3. Verás logs como:
   - `Cargando catálogo: feature_1_catalog`
   - `Item seleccionado: {...}`
   - `Parámetros extraídos del path: {...}`
   - `Calculando precio con parámetros: {...}`

Esto te ayudará a entender qué está enviando y recibiendo de la API.

## Manejo de Catálogos Vacíos

Algunos catálogos pueden retornar `data: []` (vacío), especialmente `feature_3_catalog` en electrónicos. Esto **no es un error**.

Cuando esto sucede:
- El sistema automáticamente calcula el precio
- Agrega el producto a la lista de seleccionados
- Resetea la navegación del catálogo

## Consideraciones CORS

La API debe permitir solicitudes desde el dominio de tu tienda Shopify. Si experimentas errores de CORS, necesitarás:

1. Configurar CORS en la API para permitir `*.myshopify.com`
2. O crear endpoints en el App Proxy que actúen como intermediarios

## Notas Técnicas

- Los productos seleccionados se envían como JSON en el campo `selectedProducts`
- El backend (App Proxy) convierte estos productos a `QuoteItems`
- Se calcula automáticamente el subtotal y total
- La cotización se guarda en Metafields de Shopify
- Los valores por defecto para sucursal son "Storefront Request" y el email del cliente

## Actualización del Bloque

Después de hacer cambios:

1. Guarda el archivo `cotizador.liquid`
2. Haz deploy: `shopify app deploy`
3. Refresca el preview del tema: En el editor de temas, presiona "Actualizar"
4. Recarga la página del storefront (Cmd + Shift + R)

## Testing

Para probar la integración:

1. Ve al editor de temas de Shopify
2. Agrega el bloque "Cotizador con Catálogos" a una sección
3. Guarda y previsualiza
4. Haz clic en una categoría (ej: "💰 Metales")
5. Selecciona opciones del catálogo
6. Verifica que el precio se calcule correctamente
7. Completa el formulario y envía
8. Ve a la app embebida → Cotizaciones para ver la cotización creada

