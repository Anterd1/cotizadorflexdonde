# 📋 Cotizador Shopify - Contexto y Plan de Desarrollo

## 🎯 Objetivo del Proyecto

Crear una aplicación de Shopify que permita a los usuarios crear cotizaciones utilizando artículos de una API externa, y enviar correos electrónicos tanto a la sucursal como al cliente cuando se complete una cotización.

---

## 📊 Requisitos y Limitaciones

### ✅ Lo que tenemos:
- **API Externa**: Disponible para obtener datos de artículos/productos
- **Microsoft Outlook API**: Disponible para envío de correos electrónicos
- **Diseño en Figma**: Maquetas que se compartirán mediante MCP
- **Base de datos**: Solo SQLite local (para sesiones de Shopify)

### ❌ Limitaciones:
- **NO podemos usar bases de datos externas** (PostgreSQL, MySQL en la nube, etc.)
- Solo podemos usar:
  - SQLite local (solo para sesiones de autenticación)
  - Shopify Metafields/Metaobjects (para datos de cotizaciones)
  - Servicios externos (API de artículos, Outlook API)

---

## 🏗️ Arquitectura Propuesta

### Almacenamiento de Datos

#### 1. **SQLite (Mantener actual)**
- **Uso**: Solo sesiones de autenticación de Shopify
- **Ubicación**: Archivo local `dev.sqlite`
- **Razón**: Las sesiones son temporales y no críticas

#### 2. **Shopify Metafields/Metaobjects** ⭐
- **Uso**: Guardar todas las cotizaciones
- **Ventajas**:
  - Sin necesidad de base de datos externa
  - Datos persistentes en Shopify
  - Escalable automáticamente
  - Backup automático por Shopify
  - Accesible desde cualquier servidor

#### Estructura de Cotización en Metafields:
```typescript
{
  quoteNumber: string;        // "COT-2024-001"
  shopId: string;             // ID de la tienda Shopify
  status: string;             // "draft" | "sent" | "approved" | "rejected" | "expired"
  customerName: string;
  customerEmail: string;       // Para enviar email al cliente
  customerPhone?: string;
  branchName: string;
  branchEmail: string;        // Para enviar email a la sucursal
  items: QuoteItem[];         // Array de artículos
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  notes?: string;
  validUntil: Date;           // Fecha de validez
  createdAt: Date;
  updatedAt: Date;
}

interface QuoteItem {
  externalProductId: string;  // ID en la API externa
  productCode: string;
  productName: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}
```

### Servicios Externos

#### 1. **API Externa de Artículos**
- **Función**: Obtener catálogo de productos/artículos
- **Uso**: Solo lectura cuando el usuario busca/selecciona productos
- **No se guarda**: El catálogo completo, solo los artículos seleccionados en cada cotización

#### 2. **Microsoft Graph API (Outlook)**
- **Función**: Envío de correos electrónicos
- **Emails a enviar**:
  1. Email a la sucursal (con detalles de la cotización)
  2. Email al cliente (con detalles de la cotización)
- **Autenticación**: Azure AD (OAuth2)
- **Variables necesarias**:
  - `OUTLOOK_CLIENT_ID`
  - `OUTLOOK_CLIENT_SECRET`
  - `OUTLOOK_TENANT_ID`
  - `OUTLOOK_FROM_EMAIL`

---

## 🔄 Flujo de la Aplicación

```
1. Usuario accede a la app de Shopify
   ↓
2. Navega a "Crear Cotización"
   ↓
3. Busca/selecciona artículos desde API externa
   ↓
4. Agrega artículos a la cotización (carrito temporal)
   ↓
5. Completa datos:
   - Cliente (nombre, email, teléfono)
   - Sucursal (nombre, email)
   - Notas adicionales
   ↓
6. Guarda como borrador o envía directamente
   ↓
7. Si envía:
   a) Guarda cotización en Shopify Metafields
   b) Genera HTML del email
   c) Envía email a sucursal (vía Outlook API)
   d) Envía email al cliente (vía Outlook API)
   e) Actualiza estado a "sent"
   ↓
8. Usuario puede ver historial de cotizaciones
```

---

## 📁 Estructura de Archivos a Crear

```
cotizadorv3/
├── app/
│   ├── services/
│   │   ├── metafields.server.ts      # Guardar/leer cotizaciones en Metafields
│   │   ├── outlook.server.ts         # Enviar emails con Outlook API
│   │   └── external-api.server.ts    # Consumir API externa de artículos
│   ├── routes/
│   │   ├── app.quotes.tsx            # Lista de cotizaciones
│   │   ├── app.quotes.new.tsx        # Crear nueva cotización
│   │   ├── app.quotes.$id.tsx        # Ver/editar cotización específica
│   │   └── app.quotes.$id.send.tsx   # Enviar cotización (action)
│   ├── utils/
│   │   ├── email-templates.ts        # Templates HTML para emails
│   │   └── quote-helpers.ts          # Funciones auxiliares
│   └── types/
│       └── quote.types.ts            # TypeScript types para cotizaciones
├── prisma/
│   └── schema.prisma                 # Mantener solo Session model
└── CONTEXTO_Y_PLAN.md               # Este documento
```

---

## 🛠️ Stack Tecnológico

### Frontend:
- **React Router v7** (ya configurado)
- **Polaris Web Components** (UI de Shopify)
- **TypeScript**

### Backend:
- **React Router Server Actions/Loaders**
- **Shopify Admin GraphQL API** (para Metafields)
- **Microsoft Graph API** (para emails)
- **Fetch API** (para API externa)

### Almacenamiento:
- **Shopify Metafields** (cotizaciones)
- **SQLite** (solo sesiones)

---

## 📦 Dependencias a Instalar

```json
{
  "@azure/identity": "^4.0.0",
  "@microsoft/microsoft-graph-client": "^3.0.7"
}
```

### Comando:
```bash
npm install @azure/identity @microsoft/microsoft-graph-client
```

---

## 🔐 Permisos Necesarios en Shopify

### Actualizar `shopify.app.toml`:
```toml
[access_scopes]
scopes = "write_products, write_metaobjects, read_metaobjects, write_metafields, read_metafields"
```

---

## 📧 Configuración de Emails

### Variables de Entorno Necesarias:
```env
# Microsoft Graph API (Outlook)
OUTLOOK_CLIENT_ID=tu-client-id-de-azure
OUTLOOK_CLIENT_SECRET=tu-client-secret
OUTLOOK_TENANT_ID=tu-tenant-id
OUTLOOK_FROM_EMAIL=email@outlook.com

# API Externa de Artículos
EXTERNAL_API_URL=https://api.ejemplo.com
EXTERNAL_API_KEY=tu-api-key
```

---

## 🎨 Diseño UI

- **Fuente**: Maquetas en Figma (se compartirán mediante MCP)
- **Componentes**: Polaris Web Components de Shopify
- **Responsive**: Debe funcionar en móvil y desktop

---

## ✅ Checklist de Implementación

### Fase 1: Configuración Base
- [ ] Instalar dependencias de Microsoft Graph
- [ ] Configurar permisos en `shopify.app.toml`
- [ ] Crear estructura de carpetas
- [ ] Configurar variables de entorno

### Fase 2: Servicios Backend
- [ ] Crear servicio de Metafields (guardar/leer cotizaciones)
- [ ] Crear servicio de Outlook (enviar emails)
- [ ] Crear servicio de API externa (obtener artículos)
- [ ] Crear templates de email (HTML)

### Fase 3: Rutas y UI
- [ ] Página de lista de cotizaciones
- [ ] Página de crear cotización
- [ ] Búsqueda/selección de artículos
- [ ] Formulario de datos del cliente/sucursal
- [ ] Vista de cotización individual
- [ ] Funcionalidad de envío

### Fase 4: Integración y Testing
- [ ] Integrar con API externa
- [ ] Probar guardado en Metafields
- [ ] Probar envío de emails
- [ ] Testing end-to-end

---

## 🚀 Próximos Pasos

1. **Decidir orden de trabajo**: ¿Maqueta primero o funcionalidad primero?
2. **Obtener credenciales**:
   - Azure AD (para Outlook)
   - API externa de artículos
3. **Compartir maquetas de Figma** (si se hace maqueta primero)
4. **Comenzar implementación**

---

## 📝 Notas Importantes

- **SQLite solo para sesiones**: No usaremos SQLite para datos de negocio
- **Metafields como única fuente de verdad**: Todas las cotizaciones se guardan en Shopify
- **Emails asíncronos**: El envío de emails puede ser asíncrono para mejor UX
- **Manejo de errores**: Implementar manejo robusto de errores en todas las llamadas externas
- **Validación**: Validar datos antes de guardar/enviar

---

## 🔗 Referencias

- [Shopify Metafields Documentation](https://shopify.dev/docs/api/admin-graphql/latest/objects/Metafield)
- [Microsoft Graph API - Send Mail](https://learn.microsoft.com/en-us/graph/api/user-sendmail)
- [Shopify App React Router](https://shopify.dev/docs/api/shopify-app-react-router)

---

**Última actualización**: $(date)
**Versión**: 1.0

