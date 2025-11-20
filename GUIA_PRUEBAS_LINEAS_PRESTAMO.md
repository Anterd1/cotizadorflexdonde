# Guía de Pruebas - Líneas de Préstamo

## Pasos para Probar

### 1. Deploy de la Extensión

```bash
cd /Users/mac/cotizadorv3/cotizadorv3
shopify app deploy
```

Presiona **`y`** cuando pregunte si quieres liberar la nueva versión.

### 2. Actualizar el Preview del Tema

1. Ve al **Editor de Temas** de Shopify
2. Presiona el botón **"Actualizar"** o refresca la página del editor
3. En el preview del storefront, presiona `Cmd + Shift + R` para recargar sin caché

### 3. Abrir Herramientas de Desarrollador

1. Presiona `F12` o `Cmd + Option + I` (Mac)
2. Ve a la pestaña **"Console"**
3. Deja abierta la consola para ver los logs

### 4. Probar Flujo Completo de Electrónicos

**Paso a paso:**

1. Haz clic en **"📱 Electrónicos"**
   - **Esperado**: Se carga el catálogo de categorías
   - **Console log**: `Cargando catálogo: subcategory_miscellaneous`

2. Selecciona **"Celular"**
   - **Esperado**: Se carga el catálogo de marcas
   - **Console log**: `Siguiente catálogo: brand_catalog`

3. Selecciona **"APPLE"** (o cualquier marca)
   - **Esperado**: Se carga el catálogo de modelos
   - **Console log**: `Siguiente catálogo: model_catalog`

4. Selecciona un modelo (ej: **"IPHONE 12 A2402 (2020)"**)
   - **Esperado**: Se carga característica 1 (almacenamiento)
   - **Console log**: `Siguiente catálogo: feature_1_catalog`

5. Selecciona **"128 GB"** (o la opción disponible)
   - **Esperado**: Se carga característica 2 (RAM)
   - **Console log**: `Siguiente catálogo: feature_2_catalog`

6. Selecciona **"4 GB RAM"** (o la opción disponible)
   - **Esperado**: 
     - Se intenta cargar `feature_3_catalog`
     - Si retorna `data: []`, se calcula el precio automáticamente
   - **Console logs**:
     ```
     Catálogo vacío - calculando precio directamente
     Calculando precio...
     Precio calculado: 20500.0
     Cargando líneas de préstamo...
     Líneas de préstamo recibidas: {...}
     ```

7. **NUEVO: Verifica que aparezca "Opciones de Préstamo"**
   - Deberías ver una sección con opciones de préstamo
   - Ejemplo:
     ```
     Tradicional
     Frecuencia: Mensual
     Préstamo: $14,350.00 (70%)
     
     [ ] 6 pagos mensuales: $2,500.00
     [ ] 12 pagos mensuales: $1,350.00
     ```

8. **Selecciona una opción de préstamo** (haz clic en un radio button)
   - **Esperado**: El radio button se marca
   - **Console log**: `Opción de préstamo seleccionada: {...}`

9. Verifica que el producto esté en **"Productos Seleccionados"**
   - Deberías ver: `Celular > APPLE > IPHONE 12... > 128 GB > 4 GB RAM - $20,500.00`

10. Completa el formulario:
    - Nombre completo
    - Email
    - Teléfono (opcional)
    - Mensaje (opcional)

11. Haz clic en **"Enviar Solicitud"**
    - **Esperado**: Mensaje de éxito
    - **Console log**: `✅ Cotización creada exitosamente`

### 5. Verificar en la App Embebida

1. Ve a la **app embebida** en Shopify Admin
2. Navega a **"Cotizaciones"**
3. Deberías ver la nueva cotización
4. Haz clic para ver los detalles
5. En las **Notas**, deberías ver:
   ```
   Cotización con 1 producto(s) seleccionado(s) desde catálogo

   Opción de Préstamo Seleccionada:
   - Producto: Tradicional
   - Frecuencia: Mensual
   - Término: 6 pagos mensuales
   - Pago: $2,500.00
   - Último pago: $2,500.00
   ```

## Escenarios de Prueba

### Escenario 1: Metales (Oro)
- Categoría: Metales
- Selección: Oro 24k
- Peso: 1.0 gramos (por defecto)
- **Esperado**: Precio calculado + opciones de préstamo

### Escenario 2: Diamantes
- Categoría: Diamantes
- Selección: Color D → Claridad IF → Tamaño 0.150 - 0.199
- **Esperado**: Precio calculado + opciones de préstamo

### Escenario 3: Vehículos
- Categoría: Vehículos
- Selección: Auto Rodando → 2025 → Acura → ADX → Versión específica
- **Esperado**: Precio calculado + opciones de préstamo (con más detalles)

## Troubleshooting

### No aparecen las líneas de préstamo

**Posibles causas:**
1. Error de CORS en la API
2. API Key incorrecta
3. Parámetros incorrectos enviados a `/simulator/type-loan`

**Solución:**
- Revisa la consola del navegador
- Busca logs de error
- Verifica la respuesta de la API en la pestaña "Network" de las herramientas de desarrollador

### Las opciones de préstamo se ven cortadas en móvil

**Solución:**
- Los estilos responsive ya están configurados
- Si necesitas ajustar, edita los estilos CSS en el bloque del tema

### No se guarda la opción de préstamo seleccionada

**Verificar:**
1. Que hayas hecho clic en un radio button
2. Que veas el log: `Opción de préstamo seleccionada: {...}`
3. Que el campo hidden `selectedLoan` tenga valor

## Logs Esperados en Console

Flujo completo:
```
Cargando catálogo: subcategory_miscellaneous
Request body: {catalog_id: "subcategory_miscellaneous", data: {...}}
Response status: 200
Catálogo recibido: {catalog: {...}}
Item seleccionado: {name: "Celular", ...}
Siguiente catálogo: brand_catalog
Parámetros para siguiente catálogo: {id_pledge_lakin: "60"}
...
Catálogo vacío - calculando precio directamente
Calculando precio con parámetros: {category_id: 5, pledge_id: 60, params: {...}}
Precio calculado: 20500.0
Cargando líneas de préstamo...
Request type-loan: {data: {category_id: 5, pledge_id: 60, price: 20500}}
Líneas de préstamo recibidas: {line_products: {...}}
Opción de préstamo seleccionada: {product: "Tradicional", frequency: "Mensual", ...}
```

## Checklist

- [ ] Deploy exitoso
- [ ] Preview del tema actualizado
- [ ] Categorías de productos visibles
- [ ] Navegación por catálogos funciona
- [ ] Precio se calcula correctamente
- [ ] **Opciones de préstamo aparecen**
- [ ] **Se puede seleccionar una opción de préstamo**
- [ ] Productos seleccionados se muestran correctamente
- [ ] Formulario se envía sin errores
- [ ] Cotización se guarda en Shopify con la opción de préstamo en las notas

