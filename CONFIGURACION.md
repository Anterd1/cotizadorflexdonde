# 🔧 Configuración del Cotizador

## Variables de Entorno Requeridas

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

### Microsoft Graph API (Outlook)
```env
OUTLOOK_CLIENT_ID=tu-client-id-de-azure
OUTLOOK_CLIENT_SECRET=tu-client-secret
OUTLOOK_TENANT_ID=tu-tenant-id
OUTLOOK_FROM_EMAIL=email@outlook.com
```

### API Externa de Artículos
```env
EXTERNAL_API_URL=https://api.ejemplo.com
EXTERNAL_API_KEY=tu-api-key
# Si la API usa otro tipo de autenticación, ajustar en external-api.server.ts
```

### API de Catálogos (Opcional - tiene valores por defecto)
```env
CATALOG_API_URL=https://s5mhb5u787.execute-api.us-east-1.amazonaws.com/qa
CATALOG_API_KEY=unQSy6sApK5bPnIZFiqMZ2NDGgTTzIb6PRpkZ7Y1
# Nota: Si no se configuran, se usarán los valores por defecto de la documentación
```

## Configuración de Azure AD (Microsoft Graph)

### Pasos para obtener las credenciales:

1. **Ir a Azure Portal**: https://portal.azure.com
2. **Azure Active Directory** → **App registrations** → **New registration**
3. **Configurar la aplicación**:
   - Name: `Cotizador Shopify`
   - Supported account types: `Accounts in this organizational directory only`
   - Redirect URI: Dejar vacío por ahora
4. **Obtener credenciales**:
   - **Application (client) ID** → `OUTLOOK_CLIENT_ID`
   - **Directory (tenant) ID** → `OUTLOOK_TENANT_ID`
5. **Crear Client Secret**:
   - **Certificates & secrets** → **New client secret**
   - Copiar el valor → `OUTLOOK_CLIENT_SECRET`
6. **Configurar permisos**:
   - **API permissions** → **Add a permission** → **Microsoft Graph**
   - **Application permissions**:
     - `Mail.Send` (para enviar emails)
   - **Grant admin consent**

## Configuración de la API Externa

Ajusta el servicio `external-api.server.ts` según la estructura real de tu API:

- **URL base**: `EXTERNAL_API_URL`
- **Autenticación**: Actualmente configurado para Bearer Token
- **Estructura esperada**: Ajustar según la respuesta real de tu API

### Estructura esperada de la API:

```json
// GET /products?search=termo&limit=50
[
  {
    "id": "123",
    "code": "PROD-001",
    "name": "Producto ejemplo",
    "description": "Descripción",
    "price": 100.00
  }
]
```

Si tu API tiene una estructura diferente, edita `app/services/external-api.server.ts` para adaptarla.

## Permisos de Shopify

Los permisos ya están configurados en `shopify.app.toml`:
- `write_products` - Para gestionar productos
- `read_products` - Para leer productos
- `write_metaobjects` - Para crear/actualizar cotizaciones
- `read_metaobjects` - Para leer cotizaciones

Las cotizaciones se guardan como **Metaobjetos** (entidades independientes), no como Metafields.

Si necesitas reinstalar la app para aplicar los nuevos permisos:
```bash
shopify app deploy
```

## Probar la Aplicación

1. **Iniciar desarrollo**:
   ```bash
   npm run dev
   ```

2. **Acceder a la app**:
   - Presiona `P` en la terminal para abrir la URL
   - O ve a: `/app/quotes`

3. **Crear una cotización**:
   - Click en "Nueva Cotización"
   - Buscar productos (requiere API externa configurada)
   - Agregar artículos
   - Completar datos del cliente y sucursal
   - Guardar

4. **Enviar cotización**:
   - Ver cotización → Click en "Enviar Cotización"
   - Se enviarán emails a sucursal y cliente (requiere Outlook configurado)

## Troubleshooting

### Error: "Faltan variables de entorno de Outlook"
- Verifica que todas las variables estén en el archivo `.env`
- Reinicia el servidor después de agregar variables

### Error: "No se pudo obtener el ID de la tienda"
- Verifica que la app tenga los permisos correctos
- Reinstala la app si es necesario

### Error al buscar productos
- Verifica que `EXTERNAL_API_URL` esté correcta
- Verifica que `EXTERNAL_API_KEY` sea válida
- Revisa la estructura de respuesta en `external-api.server.ts`

### Error al enviar emails
- Verifica credenciales de Azure AD
- Verifica que el permiso `Mail.Send` esté concedido
- Verifica que `OUTLOOK_FROM_EMAIL` sea una cuenta válida

