# 🔗 Configuración del App Proxy

Para que el bloque del cotizador funcione en el storefront, necesitas configurar el App Proxy en Shopify Partners Dashboard.

## 📋 Pasos para Configurar App Proxy

### 1. Acceder a Partners Dashboard

1. Ve a: https://partners.shopify.com/
2. Inicia sesión con tu cuenta de Partner
3. Selecciona tu app: **cotizadorv3**

### 2. Configurar App Proxy

1. En el menú lateral, ve a **App setup**
2. Busca la sección **App proxy** (puede estar en la parte inferior)
3. Haz click en **Add proxy** o **Configure proxy**

### 3. Configurar el Proxy

Completa los siguientes campos:

- **Subpath prefix**: `cotizador`
  - Este es el prefijo que aparecerá en la URL
  - La URL final será: `https://tu-tienda.myshopify.com/apps/cotizador/quote`

- **Subpath**: `quote`
  - Este es el subpath específico para el endpoint de cotizaciones

- **Proxy URL**: `https://tu-app-url.com/apps/cotizador/quote`
  - Reemplaza `tu-app-url.com` con la URL de tu app en producción
  - Ejemplo: `https://cotizador-app.herokuapp.com/apps/cotizador/quote`
  - ⚠️ **Importante**: Debe ser HTTPS y debe ser la URL pública de tu app

### 4. Guardar Configuración

- Haz click en **Save** o **Add proxy**
- Shopify validará la configuración

## 🔍 Verificar que Funciona

### Opción 1: Probar desde el Storefront

1. Agrega el bloque "Cotizador" a una página de tu tema
2. Completa el formulario
3. Haz click en "Enviar Solicitud"
4. Deberías ver el mensaje de éxito

### Opción 2: Probar con cURL

```bash
curl -X POST https://tu-tienda.myshopify.com/apps/cotizador/quote \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "shop=tu-tienda.myshopify.com" \
  -d "customerName=Test User" \
  -d "customerEmail=test@example.com" \
  -d "message=Test message"
```

## ⚠️ Notas Importantes

### Desarrollo Local

- El App Proxy **NO funciona en desarrollo local** con `shopify app dev`
- Necesitas desplegar la app a producción para probar el App Proxy
- O usar un túnel público como ngrok para desarrollo

### Seguridad

- Shopify añade headers especiales a las peticiones del App Proxy
- Deberías validar el HMAC signature en producción
- El código actual tiene autenticación básica, pero puedes mejorarla

### URL de Producción

Asegúrate de que:
- Tu app esté desplegada y accesible públicamente
- La URL use HTTPS (requerido por Shopify)
- La ruta `/apps/cotizador/quote` esté correctamente configurada

## 🐛 Troubleshooting

### Error: "Shop no válido"
- Verifica que el parámetro `shop` se esté enviando correctamente
- El shop debe ser el dominio completo (ej: `mi-tienda.myshopify.com`)

### Error: "Error de autenticación"
- Verifica que el App Proxy esté configurado correctamente en Partners Dashboard
- Asegúrate de que la URL del proxy apunte a tu app en producción
- Verifica que tu app tenga los permisos necesarios

### El formulario no envía datos
- Abre la consola del navegador (F12) para ver errores
- Verifica que la URL `/apps/cotizador/quote` sea accesible
- Verifica que el App Proxy esté activo en Partners Dashboard

## 📚 Referencias

- [Shopify App Proxy Documentation](https://shopify.dev/docs/apps/online-store/app-proxies)
- [Theme App Extensions](https://shopify.dev/docs/apps/online-store/theme-app-extensions)

