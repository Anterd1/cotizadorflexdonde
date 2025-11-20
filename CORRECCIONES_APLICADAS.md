# Correcciones Aplicadas - Errores de API y Script

## ✅ Problema 1: Script Duplicado

**Error:** `Uncaught SyntaxError: Identifier 'CotizadorApp' has already been declared`

**Causa:** El archivo `cotizador.js` se estaba cargando dos veces:
- Línea 161: `<script src="{{ 'cotizador.js' | asset_url }}" defer></script>`
- Línea 327: `<script src="{{ 'cotizador.js' | asset_url }}"></script>`

**Solución:** ✅ Eliminada la primera carga, dejando solo una al final del archivo.

**Resultado:** Ahora el script se carga solo una vez y la clase `CotizadorApp` se define correctamente.

---

## ✅ Problema 2: Endpoint Incorrecto para Electrónicos

**Error:** `POST .../simulator/catalog-ext 400 (Bad Request)`  
**Mensaje de API:** `{"message": "'ARN_SIMULATOR_CATALOG'"}`

**Causa:** La detección de endpoint usaba `.includes('brand')` que capturaba TANTO:
- `brand_catalog` (electrónicos) → debería usar `/simulator/catalog` ✅
- `brand_vehicles` (vehículos) → debería usar `/simulator/catalog-ext` ✅

**Código Incorrecto:**
```javascript
const isVehicleCatalog = catalogId.includes('brand') || ...
```
Esto hacía que `brand_catalog` se enviara a `/simulator/catalog-ext` (incorrecto).

**Código Corregido:**
```javascript
const isVehicleCatalog = catalogId === 'subcategory_vehicles' || 
                         catalogId === 'year_vehicles' || 
                         catalogId === 'brand_vehicles' ||     // ✅ Específico
                         catalogId === 'model_vehicles' || 
                         catalogId === 'version_vehicles';
```

**Resultado:** Ahora cada catálogo usa el endpoint correcto:

| Catálogo | Endpoint |
|----------|----------|
| `metal_gold_catalog` | `/simulator/catalog` ✅ |
| `diamond_color_catalog` | `/simulator/catalog` ✅ |
| `subcategory_miscellaneous` | `/simulator/catalog` ✅ |
| `brand_catalog` | `/simulator/catalog` ✅ (CORREGIDO) |
| `model_catalog` | `/simulator/catalog` ✅ |
| `feature_1_catalog` | `/simulator/catalog` ✅ |
| `subcategory_vehicles` | `/simulator/catalog-ext` ✅ |
| `year_vehicles` | `/simulator/catalog-ext` ✅ |
| `brand_vehicles` | `/simulator/catalog-ext` ✅ |

---

## ✅ Problema 3: Logging Mejorado

**Agregado:** Logs detallados en cada paso del proceso para facilitar debugging futuro.

**Logs disponibles:**
```javascript
Cargando catálogo: subcategory_miscellaneous
Endpoint: https://s5mhb5u787.execute-api.us-east-1.amazonaws.com/qa/simulator/catalog
Request: {catalog_id: "...", data: {...}}
Response status: 200
Catálogo recibido: {...}
Calculando precio con parámetros: {...}
Price response status: 200
Precio calculado: 13390
Obteniendo líneas de préstamo: {...}
Loan response status: 200
Líneas de préstamo recibidas: {...}
```

---

## Archivos Modificados

1. ✅ `extensions/cotizador/assets/cotizador.js`
   - Corrección de detección de endpoint
   - Logging detallado agregado
   - Mejor manejo de errores

2. ✅ `extensions/cotizador/blocks/cotizador.liquid`
   - Eliminada carga duplicada de script
   - Mantiene solo una inicialización

---

## Para Aplicar

```bash
cd /Users/mac/cotizadorv3/cotizadorv3
shopify app deploy
```

---

## Testing Post-Deploy

### Test 1: Electrónicos (debería funcionar ahora)

1. Recarga la página (Cmd + Shift + R)
2. Abre F12 → Console
3. Click en "📱 Electrónicos"
4. **Esperado:** Ver logs y catálogo cargarse correctamente
5. Navegar: Celular → APPLE → Modelo → Características
6. **Esperado:** Ver los 3 paneles con precio y opciones de préstamo

### Test 2: Vehículos

1. Click en "🚗 Vehículos"
2. **Esperado:** Catálogo de tipos de vehículos
3. Navegar por el flujo completo
4. **Esperado:** Ver los 3 paneles al final

### Test 3: Metales y Diamantes

1. Click en "💰 Metales" o "💎 Diamantes"
2. **Esperado:** Funcionar correctamente

---

## Si Aún Hay Errores

Comparte en la consola:
1. Todos los logs que aparezcan
2. Especialmente los que digan `Request:` y `Error response:`

Con esa información podré identificar exactamente qué está fallando.

---

## Verificación de Tamaños

```bash
cd /Users/mac/cotizadorv3/cotizadorv3/extensions/cotizador/blocks
wc -c cotizador.liquid
```

Debería mostrar **menos de 100,000 bytes** (100 KB).

```bash
cd /Users/mac/cotizadorv3/cotizadorv3/extensions/cotizador/assets
ls -lh cotizador.css cotizador.js
```

Debería mostrar los tamaños de los assets (sin límite).

