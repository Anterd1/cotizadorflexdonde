# Troubleshooting - API de Catálogos

## Errores Corregidos

### ✅ Error 1: "Identifier 'CotizadorApp' has already been declared"

**Causa:** Script cargándose dos veces  
**Solución:** Removida auto-inicialización del JS, ahora solo se inicializa desde el Liquid  
**Estado:** ✅ CORREGIDO

### 🔍 Error 2: "Failed to load resource: 400" en `/simulator/catalog-ext`

**Causa:** Parámetros incorrectos enviados a la API  
**Solución:** Necesitas verificar los logs de la consola para ver exactamente qué se está enviando

## Cómo Usar los Logs para Debugging

### Pasos para Identificar el Problema:

1. **Abrir la Consola del Navegador**
   - Presiona `F12` o `Cmd + Option + I`
   - Ve a la pestaña **"Console"**

2. **Limpiar la Consola**
   - Click en el ícono 🚫 para limpiar logs anteriores

3. **Reproducir el Error**
   - Recarga la página (Cmd + Shift + R)
   - Click en "🚗 Vehículos" (o la categoría que falla)

4. **Buscar estos Logs**

Deberías ver logs como estos:

```
Cargando catálogo: subcategory_vehicles
Endpoint: https://s5mhb5u787.execute-api.us-east-1.amazonaws.com/qa/simulator/catalog-ext
Request: {
  catalog_id: "subcategory_vehicles",
  data: {
    user_id: "",
    prospect_flag: false,
    // ⚠️ AQUÍ BUSCA SI HAY PARÁMETROS EXTRA QUE NO DEBERÍAN ESTAR
  }
}
Response status: 400
Error response: {...}  // ⚠️ ESTE ES EL MENSAJE DE ERROR DE LA API
```

### Posibles Causas del Error 400

#### Causa 1: Parámetros Extra No Permitidos

**Problema:** Estás enviando parámetros que la API no espera para ese catálogo específico.

**Ejemplo Incorrecto:**
```json
{
  "catalog_id": "subcategory_vehicles",
  "data": {
    "user_id": "",
    "prospect_flag": false,
    "vehicle_type": "2"  // ❌ Este parámetro NO va aquí
  }
}
```

**Ejemplo Correcto:**
```json
{
  "catalog_id": "subcategory_vehicles",
  "data": {
    "user_id": "",
    "prospect_flag": false
  }
}
```

#### Causa 2: Parámetros Requeridos Faltantes

**Ejemplo:** Para `brand_vehicles` se requiere `vehicle_type` y `year`:

```json
{
  "catalog_id": "brand_vehicles",
  "data": {
    "vehicle": "0",
    "brand": "",
    "vehicle_type": "2",     // ✅ Requerido
    "model": "",
    "year": "2025"           // ✅ Requerido
  }
}
```

#### Causa 3: Formato Incorrecto de Parámetros

**Ejemplo:** `year` debe ser string, no número:
```json
"year": "2025"  // ✅ Correcto
"year": 2025    // ❌ Incorrecto
```

### Qué Revisar en la Consola

**1. Request Body Enviado:**
```javascript
Request: { catalog_id: "...", data: {...} }
```
- ¿Tiene solo los parámetros que la documentación dice?
- ¿Los valores son del tipo correcto (string vs número)?

**2. Error Response:**
```javascript
Error response: "Invalid parameter: ..."
```
- Lee el mensaje de error de la API
- Te dirá exactamente qué está mal

**3. CatalogPath:**
```javascript
catalogPath: [{...}, {...}]
```
- Verifica que tenga la información correcta del flujo

## Soluciones Rápidas

### Solución 1: Verificar que solo se envíen parámetros necesarios

Según la documentación:

**Para `subcategory_vehicles` (primer catálogo):**
```json
{
  "catalog_id": "subcategory_vehicles",
  "data": {
    "user_id": "",
    "prospect_flag": false
  }
}
```

**Para `year_vehicles`:**
```json
{
  "catalog_id": "year_vehicles",
  "data": {
    "vehicle": "0",
    "brand": "",
    "vehicle_type": "2",  // Del item seleccionado anteriormente
    "model": "",
    "year": ""
  }
}
```

### Solución 2: Limpiar parámetros antes de enviar

El código actual en `extractParamsFromPath()` extrae TODOS los parámetros encontrados. Necesitamos filtrarlos según el catálogo.

## Código para Compartir

Si el error persiste, **comparte en la consola**:

1. El log que dice `Request: {...}`
2. El log que dice `Error response: ...`
3. El log que dice `catalogPath: [...]`

Con esa información puedo ver exactamente qué está fallando y corregirlo.

## Validación de la API

Puedes probar la API directamente con curl para verificar que funcione:

```bash
curl -X POST https://s5mhb5u787.execute-api.us-east-1.amazonaws.com/qa/simulator/catalog-ext \
  -H "Content-Type: application/json" \
  -H "x-api-key: unQSy6sApK5bPnIZFiqMZ2NDGgTTzIb6PRpkZ7Y1" \
  -d '{
    "catalog_id": "subcategory_vehicles",
    "data": {
      "user_id": "",
      "prospect_flag": false
    }
  }'
```

Si esto funciona, el problema está en cómo estamos construyendo los parámetros en el JavaScript.

## Próximos Pasos

1. **Haz deploy** con los cambios actuales (logging mejorado)
2. **Abre la consola** del navegador
3. **Click en "Electrónicos"** (este debería funcionar)
4. **Click en "Vehículos"** y **comparte los logs exactos** que aparecen
5. Con esos logs, corregiré los parámetros exactos que necesita la API

El error 400 es típicamente un problema de parámetros incorrectos, y con los nuevos logs podremos identificarlo exactamente.

