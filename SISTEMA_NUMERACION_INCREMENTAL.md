# Sistema de Numeración Incremental

## ✅ Cambio Implementado

El sistema de numeración de cotizaciones ha sido actualizado de formato con año y aleatorio a **incremental simple**.

## Formato de Numeración

### Antes:
```
COT-2025-3849
COT-2025-6317
COT-2025-2205
```
- Formato: `COT-{AÑO}-{ALEATORIO}`
- Números no correlacionados
- Difícil de rastrear secuencia

### Ahora:
```
COT-1
COT-2
COT-3
COT-4
...
COT-100
```
- Formato: `COT-{NÚMERO}`
- **Incremental de 1 en 1**
- Fácil de rastrear
- Secuencia clara

## 🔧 Cómo Funciona

### Algoritmo:

1. **Al crear una nueva cotización:**
   - Obtiene todas las cotizaciones existentes
   - Extrae el número de cada una (usando regex `COT-(\d+)`)
   - Encuentra el número más alto
   - Incrementa en 1
   - Genera el nuevo número

2. **Ejemplo:**
   ```
   Cotizaciones existentes: COT-1, COT-2, COT-5
   Número más alto: 5
   Siguiente número: 6
   Nueva cotización: COT-6
   ```

3. **Si hay cotizaciones con formato antiguo:**
   ```
   Existentes: COT-2025-1234, COT-2025-5678
   No coinciden con COT-(\d+)
   maxNumber = 0
   Siguiente número: 1
   Nueva cotización: COT-1
   ```

### Código (app/services/metafields.server.ts):

```typescript
// Obtener cotizaciones existentes
const existingQuotes = await getQuotes(admin, shopId);

// Extraer el número más alto
let maxNumber = 0;
existingQuotes.forEach(quote => {
  const match = quote.quoteNumber.match(/^COT-(\d+)$/);
  if (match) {
    const num = parseInt(match[1]);
    if (num > maxNumber) {
      maxNumber = num;
    }
  }
});

// Incrementar en 1
const nextNumber = maxNumber + 1;
quoteNumber = `COT-${nextNumber}`;
```

## ⚠️ Consideraciones

### Cotizaciones Existentes

Si ya tienes cotizaciones con el formato antiguo (`COT-2025-XXXX`):
- NO se renumerarán automáticamente
- Se quedarán con su número original
- Las **nuevas cotizaciones** empezarán desde **COT-1**

### Si quieres limpiar y empezar de cero:

**Opción 1: Eliminar metafields antiguos (desde Shopify Admin)**
1. Settings → Custom Data → Metafields
2. Busca namespace "cotizador"
3. Elimina todos los metafields
4. La próxima cotización será COT-1

**Opción 2: Dejar las existentes y continuar**
- Las antiguas seguirán con `COT-2025-XXXX`
- Las nuevas empezarán con `COT-1`, `COT-2`, etc.

### Manejo de Errores

Si por alguna razón falla al obtener cotizaciones existentes:
- **Fallback:** Usa timestamp como número
- Formato: `COT-1731949234567`
- Garantiza que siempre se cree un número único

## 🎯 Ventajas

✅ **Fácil de recordar:** "La cotización 5" vs "La cotización 2025-3849"  
✅ **Secuencia clara:** Puedes ver cuántas se han creado  
✅ **Profesional:** Formato estándar usado por la mayoría de empresas  
✅ **Corto:** Menos caracteres, más legible  
✅ **Escalable:** Funciona hasta COT-999999... (millones)  

## 📝 Ejemplo de Uso

### Primera cotización:
```
No hay cotizaciones existentes
maxNumber = 0
nextNumber = 1
Número generado: COT-1
```

### Décima cotización:
```
Cotizaciones existentes: COT-1 a COT-9
maxNumber = 9
nextNumber = 10
Número generado: COT-10
```

### Si se elimina COT-5:
```
Existentes: COT-1, COT-2, COT-3, COT-4, COT-6, COT-7
maxNumber = 7
nextNumber = 8
Número generado: COT-8
```
(Se salta el 5, continúa la secuencia)

## 🧪 Probar

1. **Crear nueva cotización** desde:
   - Botón "🧪 Crear Cotización de Prueba"
   - O "Nueva Cotización" en la app

2. **Verificar el número:**
   - Debería ser `COT-1` (si es la primera con nuevo formato)
   - O `COT-X` donde X es el siguiente número disponible

3. **Crear otra cotización:**
   - Debería ser `COT-2` (o X+1)

## 🔄 Migración

Si necesitas renumerar cotizaciones antiguas:

1. Exporta las cotizaciones
2. Elimina los metafields antiguos
3. Recrea las cotizaciones (se numerarán automáticamente COT-1, COT-2, etc.)

O déjalas como están y las nuevas usarán el nuevo formato.

## ✅ Compatibilidad

El sistema es compatible con:
- Cotizaciones antiguas (COT-2025-XXXX)
- Cotizaciones nuevas (COT-1, COT-2, etc.)
- Ambos formatos pueden coexistir sin problemas


