# 🚀 Guía de Despliegue en Fly.io

## ✅ Pasos Completados

1. ✅ Fly.io CLI instalado
2. ✅ Login realizado
3. ✅ `schema.prisma` actualizado para usar `DATABASE_URL`
4. ✅ `fly.toml` creado con configuración

## 📋 Próximos Pasos

### 1. Agregar Método de Pago en Fly.io

Ve a: https://fly.io/dashboard/hector-corona/billing

Agrega una tarjeta de crédito (no se cobrará nada con el plan gratuito).

### 2. Crear la App en Fly.io

```bash
cd /Users/mac/cotizadorv3/cotizadorv3
export FLYCTL_INSTALL="/Users/mac/.fly"
export PATH="$FLYCTL_INSTALL/bin:$PATH"

# Crear la app (después de agregar la tarjeta)
fly apps create cotizadorv3 --org hector-corona
```

### 3. Crear Volumen Persistente para SQLite

```bash
# Crear volumen de 1GB en la región iad (Ashburn, Virginia)
fly volumes create data --size 1 --region iad --app cotizadorv3
```

### 4. Configurar Variables de Entorno

**IMPORTANTE:** Primero haz el deploy para obtener la URL, luego actualiza `SHOPIFY_APP_URL`.

```bash
# Variables de Shopify (OBLIGATORIAS)
fly secrets set SHOPIFY_API_KEY="tu_api_key_de_shopify" --app cotizadorv3
fly secrets set SHOPIFY_API_SECRET="tu_api_secret_de_shopify" --app cotizadorv3
fly secrets set SCOPES="read_metaobjects,read_products,write_metaobjects,write_products" --app cotizadorv3
fly secrets set NODE_ENV="production" --app cotizadorv3

# IMPORTANTE: Primero haz deploy, obtén la URL (será https://cotizadorv3.fly.dev)
# Luego actualiza esta variable:
fly secrets set SHOPIFY_APP_URL="https://cotizadorv3.fly.dev" --app cotizadorv3

# Variables opcionales (si las usas)
fly secrets set OUTLOOK_CLIENT_ID="tu_client_id" --app cotizadorv3
fly secrets set OUTLOOK_CLIENT_SECRET="tu_client_secret" --app cotizadorv3
fly secrets set OUTLOOK_TENANT_ID="tu_tenant_id" --app cotizadorv3
fly secrets set OUTLOOK_FROM_EMAIL="tu_email@outlook.com" --app cotizadorv3

# API de catálogos (opcional, tiene valores por defecto)
fly secrets set CATALOG_API_URL="https://s5mhb5u787.execute-api.us-east-1.amazonaws.com/qa" --app cotizadorv3
fly secrets set CATALOG_API_KEY="unQSy6sApK5bPnIZFiqMZ2NDGgTTzIb6PRpkZ7Y1" --app cotizadorv3
```

### 5. Hacer el Primer Deploy

```bash
fly deploy --app cotizadorv3
```

Esto construirá y desplegará tu app. La URL será: `https://cotizadorv3.fly.dev`

### 6. Actualizar SHOPIFY_APP_URL

Después del deploy, actualiza la variable con la URL real:

```bash
fly secrets set SHOPIFY_APP_URL="https://cotizadorv3.fly.dev" --app cotizadorv3
```

### 7. Actualizar shopify.app.toml

Edita `shopify.app.toml` y actualiza las URLs:

```toml
application_url = "https://cotizadorv3.fly.dev"

[app_proxy]
url = "https://cotizadorv3.fly.dev/apps/cotizador"

[auth]
redirect_urls = [ "https://cotizadorv3.fly.dev/api/auth" ]
```

### 8. Deploy a Shopify

```bash
shopify app deploy --force
```

## 🔧 Comandos Útiles

```bash
# Ver logs en tiempo real
fly logs --app cotizadorv3

# Ver estado de la app
fly status --app cotizadorv3

# Abrir la app en el navegador
fly open --app cotizadorv3

# Ver variables de entorno
fly secrets list --app cotizadorv3

# Reiniciar la app
fly apps restart cotizadorv3

# SSH a la máquina (para debugging)
fly ssh console --app cotizadorv3
```

## 🐛 Troubleshooting

### Error: "We need your payment information"
- Ve a https://fly.io/dashboard/hector-corona/billing y agrega una tarjeta

### Error: "Volume not found"
- Asegúrate de crear el volumen: `fly volumes create data --size 1 --region iad --app cotizadorv3`

### Error: "Database migration failed"
- Verifica que el volumen esté montado correctamente en `fly.toml`
- Verifica que `DATABASE_URL` esté configurado: `file:/data/prod.sqlite`

### La app no inicia
- Revisa los logs: `fly logs --app cotizadorv3`
- Verifica las variables de entorno: `fly secrets list --app cotizadorv3`

## 📝 Notas

- El plan gratuito de Fly.io incluye 3 VMs compartidas y 3GB de almacenamiento
- SQLite se guarda en el volumen persistente `/data/prod.sqlite`
- La app estará siempre activa (no se suspende como Render)
- SSL es automático y gratuito


