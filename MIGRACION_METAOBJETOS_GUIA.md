# Guía de Migración a Metaobjetos

## Estado Actual

El sistema ha sido migrado de Metafields a Metaobjetos para mejor organización y escalabilidad.

## Pasos para Completar la Migración

### Paso 1: Crear Definición de Metaobjeto en Shopify Admin

1. **Ir a Shopify Admin:**
   - Settings → Custom Data → Metaobjects
   - Click en "Add definition"

2. **Configuración Básica:**
   - **Name:** Cotizacion
   - **Type:** `cotizacion` (exactamente así, minúsculas)
   - **Fields to display:** Selecciona "quote_number" (lo crearás en el siguiente paso)

3. **Agregar Campos (en orden):**

| Campo | Tipo | Configuración |
|-------|------|---------------|
| quote_number | Single line text | Requerido, Único |
| customer_name | Single line text | Requerido |
| customer_email | Single line text | Requerido |
| customer_phone | Single line text | Opcional |
| status | Single line text | Requerido, Default: "draft" |
| items | JSON | Requerido |
| subtotal | Decimal | Requerido |
| tax | Decimal | Requerido, Default: 0 |
| discount | Decimal | Requerido, Default: 0 |
| total | Decimal | Requerido |
| notes | Multi-line text | Opcional |
| loan_info | JSON | Opcional |
| origin | Single line text | Opcional, Default: "admin" |
| valid_until | Date | Requerido |

4. **Acceso:**
   - ✅ Storefront API access (activar)
   - ✅ Admin API access (activar automáticamente)

5. **Guardar la definición**

### Paso 2: Reinstalar la App con Nuevos Permisos

Los permisos ya fueron actualizados en `shopify.app.toml`:
```toml
scopes = "write_products, read_products, write_metaobjects, read_metaobjects"
```

**Ejecuta:**
```bash
cd /Users/mac/cotizadorv3/cotizadorv3
shopify app deploy
```

Esto actualizará los permisos de la app.

### Paso 3: Probar el Sistema con Metaobjetos

1. **Ir a la app** (shopify app dev si no está corriendo)
2. **Ve a Cotizaciones**
3. **Click en "🧪 Crear Cotización de Prueba"**
4. **Espera** (llamará a la API)
5. **Recarga** la página (F5)

**Deberías ver:**
- Nueva cotización con número: **COT-1**
- Total: **$20,500.00** (precio real)
- 1 producto del catálogo

6. **Verificar en Shopify Admin:**
   - Settings → Custom Data → Metaobjects → Cotizaciones
   - Deberías ver la cotización COT-1

### Paso 4: Eliminar Metafields Antiguos (Opcional)

Una vez verificado que todo funciona:

1. **Ir a:** `/app/admin/clean-metafields`
2. **Leer las advertencias**
3. **Click en "🗑️ Eliminar Metafields Antiguos"**
4. **Confirmar**
5. **Espera** a que termine
6. **Verás el resultado:** "X metafields eliminados"

Esto eliminará las 4 cotizaciones antiguas (COT-2025-XXXX).

### Paso 5: Validar Funcionalidad Completa

**Crear cotización desde la app:**
1. Nueva Cotización → Tab "Catálogos"
2. Seleccionar producto
3. Llenar datos
4. Guardar

**Verificar:**
- ✅ Se guarda como Metaobjeto
- ✅ Aparece en el dashboard
- ✅ Número incremental (COT-2, COT-3, etc.)
- ✅ Visible en Shopify Admin

## Cambios Realizados

### Archivos Modificados:

1. `shopify.app.toml` - Permisos actualizados
2. `app/services/metaobjects.server.ts` - Nuevo servicio (reemplaza metafields.server.ts)
3. `app/routes/app.quotes.tsx` - Usa metaobjetos
4. `app/routes/app.quotes.new.tsx` - Usa metaobjetos
5. `app/routes/app.quotes.$id.tsx` - Usa metaobjetos
6. `app/routes/apps.cotizador.quote.tsx` - Usa metaobjetos
7. `app/scripts/clean-old-metafields.ts` - Script de limpieza
8. `app/routes/app.admin.clean-metafields.tsx` - Ruta de limpieza

### Archivos Mantenidos:

- `app/services/metafields.server.ts` - Mantener como backup/referencia

## Ventajas de la Migración

### Antes (Metafields):
```
Shop
  ├── Metafield: cotizador.quote_COT-2025-3849
  ├── Metafield: cotizador.quote_COT-2025-6317
  └── (mezclado con otros datos del Shop)
```

### Ahora (Metaobjetos):
```
Shop
  └── (solo datos de la tienda)

Metaobjetos → Cotizaciones
  ├── COT-1
  ├── COT-2
  └── COT-3
```

### Beneficios:

✅ Separación de datos (cotizaciones NO mezcladas con datos del Shop)  
✅ Sin límite de 250 (era límite de metafields por recurso)  
✅ Visible en Shopify Admin en sección dedicada  
✅ Búsquedas y filtros nativos de Shopify  
✅ Mejor UI para gestionar  
✅ Escalable a miles de cotizaciones  
✅ Exportación más fácil  
✅ Preparado para relaciones con Customers  

## Troubleshooting

### Error: "Metaobject definition not found"

**Causa:** No has creado la definición del metaobjeto en Shopify Admin

**Solución:**
1. Shopify Admin → Settings → Custom Data → Metaobjects
2. "Add definition"
3. Tipo: `cotizacion` (minúsculas)
4. Agregar todos los campos listados arriba

### Error: "Insufficient permissions"

**Causa:** Los nuevos scopes no se han aplicado

**Solución:**
```bash
shopify app deploy
```

Luego reinstala la app en tu tienda de desarrollo.

### Las cotizaciones no aparecen

**Causa:** Puede que estés viendo las antiguas (metafields)

**Solución:**
1. Refresca el dashboard (F5)
2. Verifica que estés usando el código actualizado
3. Revisa la consola del navegador para logs

### Quiero volver a Metafields

**Solución:**
1. Cambia los imports en las rutas de vuelta a `metafields.server`
2. `shopify app deploy`
3. Los datos en metaobjetos se mantendrán

## Próximos Pasos (Futuro)

1. Agregar campo `customer_ref` para relacionar con Customers de Shopify
2. Agregar más campos si es necesario
3. Implementar búsqueda y filtros avanzados
4. Integrar con Shopify Flow para automatizaciones
5. Eliminar archivo `metafields.server.ts` cuando estés 100% seguro

## Notas Importantes

- Las cotizaciones antiguas (COT-2025-XXXX) serán eliminadas cuando ejecutes el script
- Las nuevas usarán numeración simple (COT-1, COT-2, etc.)
- El sistema está preparado para escalar a miles de cotizaciones
- Código más limpio y mantenible


