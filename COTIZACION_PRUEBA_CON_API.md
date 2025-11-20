# Cotización de Prueba con Datos Reales de la API

## ✅ Implementación Completada

El botón "🧪 Crear Cotización de Prueba" ahora consume la API real de catálogos y crea cotizaciones con datos reales.

## 🔄 Flujo Completo

Cuando haces click en "🧪 Crear Cotización de Prueba":

### 1. Obtiene Catálogo de Electrónicos
```
POST /simulator/catalog
{
  "catalog_id": "subcategory_miscellaneous",
  "data": { "user_id": "", "prospect_flag": false }
}
```
**Resultado:** Lista de categorías (Celular, Pantalla, Laptop, etc.)  
**Selecciona:** Primera categoría (generalmente "Celular")

### 2. Obtiene Marcas
```
POST /simulator/catalog
{
  "catalog_id": "brand_catalog",
  "data": { "id_pledge_lakin": "60" }
}
```
**Resultado:** Lista de marcas (APPLE, SAMSUNG, etc.)  
**Selecciona:** Primera marca (generalmente "APPLE" o "ACER")

### 3. Obtiene Modelos
```
POST /simulator/catalog
{
  "catalog_id": "model_catalog",
  "data": { 
    "id_pledge_lakin": "60",
    "brand_id": "161"
  }
}
```
**Resultado:** Lista de modelos de la marca  
**Selecciona:** Primer modelo disponible

### 4. Calcula Precio Real
```
POST /simulator/price
{
  "data": {
    "category_id": 5,
    "pledge_id": 60,
    "params": {
      "brand_id": "161",
      "model_id": "37637",
      "feature1_id": "",
      "feature2_id": "",
      "feature3_id": ""
    }
  }
}
```
**Resultado:** Precio real calculado por la API (ej: $20,500.00)

### 5. Obtiene Líneas de Préstamo
```
POST /simulator/type-loan
{
  "data": {
    "category_id": 5,
    "pledge_id": 60,
    "price": 20500.00
  }
}
```
**Resultado:** Opciones de préstamo (Tradicional, Pagos Fijos)  
**Selecciona:** Primera opción disponible

### 6. Guarda en Metafields
```typescript
saveQuote(admin, shopId, {
  customerName: "Cliente de Prueba - API Real",
  customerEmail: "test-api@example.com",
  items: [{
    productName: "Celular > APPLE > [Modelo]",
    unitPrice: 20500.00,
    totalPrice: 20500.00,
    ...
  }],
  total: 20500.00,
  notes: "... con opción de préstamo ...",
  ...
});
```

---

## 📊 Lo Que Verás en el Dashboard

### En la Lista:

| Campo | Valor Real |
|-------|------------|
| Número | COT-2025-XXXX |
| Cliente | Cliente de Prueba - API Real |
| Email | test-api@example.com |
| Productos | **1 producto** (badge azul) |
| Estado | 📝 Borrador |
| Total | **$20,500.00** (en verde) |
| Origen | 🖥️ (Admin) |
| Icono | 💳 (tiene opción de préstamo) |

### En el Detalle:

**Productos:**
- Nombre: "Celular > APPLE > [Modelo]"
- Precio: $20,500.00
- Total: $20,500.00

**Opción de Préstamo:**
- Card morado con degradado
- Tipo de Plan: Tradicional / Pagos Fijos
- Frecuencia: Diario / Semanal / Catorcenal / Mensual
- Término: "X pagos"
- Montos de pago

**Notas:**
```
Cotización de prueba con datos reales de la API de Catálogos

Categoría: Celular
Marca: APPLE
Modelo: [Nombre del modelo]
Precio calculado por API: $20,500.00

Opción de Préstamo Seleccionada:
- Producto: Tradicional
- Frecuencia: Diario
- Término: 1 pago diario
- Pago: $205.20
- Último pago: $20,705.20
```

---

## 🎯 Para Probar

1. **Recarga la app** en el navegador (si ya está abierta)
2. **Ve a "Cotizaciones"**
3. **Click en "🧪 Crear Cotización de Prueba"**
4. **Espera unos segundos** (está llamando a la API 5 veces)
5. **Verás el mensaje mejorado** con precio y producto
6. **Recarga la página** (F5)
7. **Verás la nueva cotización** con:
   - "1 producto" (no "Sin productos")
   - Total > $0 (no "$0.00")
   - Icono 💳

---

## 🔍 Logs en la Consola

Verás logs detallados:
```
🧪 [Test] Creando cotización de prueba con datos reales de la API...
📱 [Test] Obteniendo catálogo de electrónicos...
🏷️ [Test] Obteniendo marcas...
📱 [Test] Obteniendo modelos...
💰 [Test] Calculando precio con la API...
💰 [Test] Precio calculado: $20500.00
💳 [Test] Obteniendo líneas de préstamo...
💳 [Test] Opción de préstamo: Tradicional - Diario - 1 pago diario
✅ [Test] Cotización de prueba creada: COT-2025-XXXX
📦 [Test] Producto: Celular > APPLE > [Modelo]
💰 [Test] Total: $20500.00
```

---

## ✨ Validación Completa

Con esto validarás:
- ✅ API de Catálogos funciona (`/simulator/catalog`)
- ✅ Cálculo de precios funciona (`/simulator/price`)
- ✅ Líneas de préstamo funcionan (`/simulator/type-loan`)
- ✅ Guardado en Metafields funciona
- ✅ Dashboard muestra información real
- ✅ Vista de detalle muestra opción de préstamo
- ✅ Todo el flujo end-to-end funciona

---

## 🚀 Próximo Paso

Si esto funciona correctamente, entonces SOLO falta configurar el **App Proxy** para que el formulario del storefront también funcione.

El código del storefront ya está listo, solo necesita que el endpoint `/apps/cotizador/quote` esté accesible.


