# Almacenamiento de Cotizaciones - Metaobjetos

## Sistema Actual

Las cotizaciones se almacenan como **Metaobjetos de Shopify**, que son entidades independientes y no están asociadas al Shop.

## Estructura

### Tipo de Metaobjeto: `cotizacion`

Cada cotización es una entrada (entry) del tipo `cotizacion` con los siguientes campos:

| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| quote_number | Single line text | Identificador único | COT-1, COT-2 |
| customer_name | Single line text | Nombre del cliente | Juan Pérez |
| customer_email | Single line text | Email del cliente | juan@email.com |
| customer_phone | Single line text | Teléfono | 123-456-7890 |
| status | Single line text | Estado | draft, sent, approved, rejected |
| items | JSON | Array de productos | [{...}, {...}] |
| subtotal | Decimal | Subtotal | 20500.00 |
| tax | Decimal | Impuestos | 0.00 |
| discount | Decimal | Descuentos | 0.00 |
| total | Decimal | Total final | 20500.00 |
| notes | Multi-line text | Notas y mensaje | Texto libre |
| loan_info | JSON | Info de préstamo | {...} |
| origin | Single line text | Origen | storefront, admin |
| valid_until | Date | Válida hasta | 2025-12-31 |

### Metadata Automática

Shopify agrega automáticamente:
- `id` - ID único del metaobjeto
- `handle` - Handle único (cot-1, cot-2, etc.)
- `createdAt` - Fecha de creación
- `updatedAt` - Última actualización

## Numeración Incremental

### Sistema:
- Primera cotización: **COT-1**
- Segunda cotización: **COT-2**
- Tercera cotización: **COT-3**
- etc.

### Algoritmo:
1. Obtener todas las cotizaciones existentes
2. Buscar el número más alto (ej: COT-5)
3. Incrementar en 1 (siguiente: COT-6)
4. Usar ese número para la nueva cotización

### Handle del Metaobjeto:
- Basado en el quote_number en minúsculas
- COT-1 → handle: `cot-1`
- COT-2 → handle: `cot-2`

## Acceso a los Datos

### Desde la App Embebida:

```typescript
import { getQuotes, saveQuote, getQuoteById } from "../services/metaobjects.server";

// Obtener todas
const quotes = await getQuotes(admin, shopId);

// Crear nueva
const quote = await saveQuote(admin, shopId, {...});

// Obtener una específica
const quote = await getQuoteById(admin, shopId, quoteId);
```

### Desde Shopify Admin:

1. Settings → Custom Data → Metaobjects
2. Click en "Cotizaciones"
3. Ver lista de todas las cotizaciones
4. Búsqueda nativa por cualquier campo
5. Filtros por estado, fecha, etc.

### Desde GraphQL:

```graphql
query {
  metaobjects(type: "cotizacion", first: 50) {
    edges {
      node {
        id
        handle
        fields {
          key
          value
        }
      }
    }
  }
}
```

## Límites

- **Por tienda:** Ilimitado (prácticamente)
- **Por query:** 250 metaobjetos (puedes paginar)
- **Tamaño por campo:** 64 KB
- **Performance:** Optimizado por Shopify

## Ventajas vs Metafields

| Aspecto | Metafields (Antiguo) | Metaobjetos (Nuevo) |
|---------|---------------------|---------------------|
| Límite | 250 por Shop | Ilimitado |
| Separación | Mezclado con Shop | Independiente ✅ |
| UI Admin | Básica | Avanzada ✅ |
| Búsquedas | Manual en código | Nativas ✅ |
| Filtros | Manual en código | Nativos ✅ |
| Relaciones | No | Sí (futuro) ✅ |
| Exportación | Compleja | Fácil ✅ |

## Migración de Datos Antiguos

Las cotizaciones antiguas (COT-2025-XXXX en Metafields) se eliminan usando:

**Ruta:** `/app/admin/clean-metafields`

**Script:** `app/scripts/clean-old-metafields.ts`

⚠️ **PRECAUCIÓN:** Esta acción es irreversible. Asegúrate de que los Metaobjetos funcionen antes de eliminar.

## Archivos de Servicio

- `app/services/metaobjects.server.ts` - Servicio actual (en uso)
- `app/services/metafields.server.ts` - Servicio antiguo (backup)

## Referencias

- [Shopify Metaobjects Documentation](https://shopify.dev/docs/apps/build/custom-data/metaobjects)
- [GraphQL Admin API - Metaobjects](https://shopify.dev/docs/api/admin-graphql/latest/objects/Metaobject)

