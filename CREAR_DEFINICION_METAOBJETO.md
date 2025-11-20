# Crear Definición de Metaobjeto - Paso a Paso

## Instrucciones Detalladas

### 1. Acceder a Metaobjects

1. Abre **Shopify Admin** de tu tienda
2. Ve a **Settings** (⚙️ abajo a la izquierda)
3. En el menú, busca **Custom Data**
4. Click en **Metaobjects**
5. Click en el botón **"Add definition"**

### 2. Configuración Básica

**Name:**
```
Cotizacion
```

**Type:**
```
cotizacion
```
⚠️ **Importante:** Debe ser exactamente `cotizacion` en minúsculas, sin acentos.

**Description (opcional):**
```
Cotizaciones generadas desde el formulario del cotizador con integración a la API de catálogos.
```

### 3. Agregar Campos

Click en **"Add field"** para cada uno de estos campos:

#### Campo 1: quote_number
- **Type:** Single line text
- **Name:** quote_number
- **Description:** Número único de la cotización (COT-1, COT-2, etc.)
- ✅ **Required**
- ✅ **Use as display field** (marcar este checkbox)
- Validation: None

#### Campo 2: customer_name
- **Type:** Single line text
- **Name:** customer_name
- **Description:** Nombre completo del cliente
- ✅ **Required**

#### Campo 3: customer_email
- **Type:** Single line text
- **Name:** customer_email  
- **Description:** Email del cliente
- ✅ **Required**

#### Campo 4: customer_phone
- **Type:** Single line text
- **Name:** customer_phone
- **Description:** Teléfono del cliente
- ⭕ Optional

#### Campo 5: status
- **Type:** Single line text
- **Name:** status
- **Description:** Estado de la cotización
- ✅ **Required**
- **Default value:** draft

#### Campo 6: items
- **Type:** JSON
- **Name:** items
- **Description:** Array de productos en la cotización
- ✅ **Required**

#### Campo 7: subtotal
- **Type:** Decimal
- **Name:** subtotal
- **Description:** Subtotal de la cotización
- ✅ **Required**

#### Campo 8: tax
- **Type:** Decimal
- **Name:** tax
- **Description:** Impuestos
- ✅ **Required**
- **Default value:** 0

#### Campo 9: discount
- **Type:** Decimal
- **Name:** discount
- **Description:** Descuentos aplicados
- ✅ **Required**
- **Default value:** 0

#### Campo 10: total
- **Type:** Decimal
- **Name:** total
- **Description:** Total final de la cotización
- ✅ **Required**

#### Campo 11: notes
- **Type:** Multi-line text
- **Name:** notes
- **Description:** Notas adicionales, mensaje del cliente e información de préstamo
- ⭕ Optional

#### Campo 12: loan_info
- **Type:** JSON
- **Name:** loan_info
- **Description:** Información de la opción de préstamo seleccionada
- ⭕ Optional

#### Campo 13: origin
- **Type:** Single line text
- **Name:** origin
- **Description:** Origen de la cotización (storefront o admin)
- ⭕ Optional
- **Default value:** admin

#### Campo 14: valid_until
- **Type:** Date
- **Name:** valid_until
- **Description:** Fecha hasta la cual es válida la cotización
- ✅ **Required**

### 4. Configurar Acceso

En la sección **"Access"**:

- ✅ **Storefront API access** - ACTIVAR
  - Esto permite que los clientes puedan ver sus cotizaciones desde el storefront en el futuro

- ✅ **Admin API access** - Se activa automáticamente

### 5. Guardar

Click en **"Save"** o **"Add definition"**

## Verificación

Después de guardar:

1. Deberías ver "Cotizacion" en la lista de Metaobjects
2. El tipo debe mostrar: `cotizacion`
3. Debe mostrar "14 fields"

## Próximo Paso

Después de crear la definición:

1. Deploy de la app con los nuevos permisos:
```bash
cd /Users/mac/cotizadorv3/cotizadorv3
shopify app deploy
```

2. Probar creando una cotización

3. Verificar que aparezca en:
   - Tu app embebida (Dashboard de Cotizaciones)
   - Shopify Admin → Settings → Custom Data → Metaobjects → Cotizaciones

## Referencia Visual

```
Settings
  └── Custom Data
        └── Metaobjects
              ├── [+ Add definition] ← Click aquí
              └── Cotizacion (después de crear)
                    ├── COT-1
                    ├── COT-2
                    └── COT-3
```

## Notas

- Los nombres de campos deben ser exactamente como se especifican (snake_case)
- El tipo `cotizacion` debe estar en minúsculas
- No uses acentos en el tipo
- Marca "quote_number" como "display field" para mejor visualización

