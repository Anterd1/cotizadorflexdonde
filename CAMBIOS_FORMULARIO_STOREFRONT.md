# Cambios en el Formulario del Storefront

## Actualización realizada: Integración de API de Catálogos

### Archivo modificado
`extensions/cotizador/blocks/cotizador.liquid`

### Cambios principales

#### 1. **URLs actualizadas**
- URL Base: `https://s5mhb5u787.execute-api.us-east-1.amazonaws.com/qa`
- API Key: `unQSy6sApK5bPnIZFiqMZ2NDGgTTzIb6PRpkZ7Y1`

#### 2. **Nuevo sistema de selección de productos**

**Antes:** Solo campos de texto simple (Nombre, Email, Teléfono, Mensaje)

**Ahora:** 
- Botones de categorías: Metales 💰, Diamantes 💎, Electrónicos 📱, Vehículos 🚗
- Navegación por catálogos
- Cálculo automático de precios
- Lista de productos seleccionados

#### 3. **Manejo de catálogos vacíos**
- Cuando un catálogo retorna `data: []` (especialmente `feature_3_catalog`), automáticamente calcula el precio
- Ya no muestra "No hay opciones disponibles" innecesariamente

#### 4. **Logs para debugging**
- `console.log` en cada paso del flujo
- Logs de request/response de la API
- Logs de parámetros extraídos del path

#### 5. **Extracción mejorada de parámetros**
- Ahora extrae parámetros correctamente de `child_ids`
- Detecta categoría usando `currentCategory` además de `catalogId`
- Maneja correctamente todos los niveles del flujo de electrónicos

### Flujo de Electrónicos (ejemplo)

1. Cliente hace clic en "📱 Electrónicos"
2. Selecciona categoría: "Celular" (id_pledge_lakin: 60)
3. Selecciona marca: "APPLE" (brand_id: 161)
4. Selecciona modelo: "IPHONE 12 A2402 (2020)" (model_id: xxxxx)
5. Selecciona característica 1: "128 GB" (charat1_id: xxxxx)
6. Selecciona característica 2: "4 GB RAM" (charat2_id: xxxxx)
7. **feature_3_catalog retorna `data: []`** → Se calcula el precio automáticamente
8. El producto se agrega a "Productos Seleccionados"

### Parámetros enviados a `/simulator/price`

```json
{
  "data": {
    "category_id": 5,
    "pledge_id": 60,
    "params": {
      "brand_id": "161",
      "model_id": "xxxxx",
      "feature1_id": "xxxxx",
      "feature2_id": "xxxxx",
      "feature3_id": ""
    }
  }
}
```

### Cómo verificar que funciona

1. Abre las herramientas de desarrollador (F12) → Console
2. Haz clic en "📱 Electrónicos"
3. Verás logs como:
   ```
   Cargando catálogo: subcategory_miscellaneous
   Request body: {...}
   Response status: 200
   Catálogo recibido: {...}
   ```
4. Selecciona opciones y verás:
   ```
   Item seleccionado: {...}
   Siguiente catálogo: brand_catalog
   Parámetros para siguiente catálogo: {id_pledge_lakin: "60"}
   ```
5. Al final verás:
   ```
   Catálogo vacío - calculando precio directamente
   Calculando precio con parámetros: {category_id: 5, pledge_id: 60, params: {...}}
   ```

### Deploy necesario

Para aplicar los cambios:

```bash
cd /Users/mac/cotizadorv3/cotizadorv3
shopify app deploy
```

Después de hacer deploy:
1. Ve al editor de temas
2. Actualiza el preview
3. Recarga la página (Cmd + Shift + R)

### Troubleshooting

Si ves "No hay opciones disponibles" después de seleccionar todo:
- Revisa la consola del navegador para ver los logs
- Verifica que los parámetros se estén enviando correctamente
- Confirma que la API esté respondiendo con status 200

Si hay error de CORS:
- La API debe permitir solicitudes desde `*.myshopify.com`
- Contacta al equipo de la API para configurar CORS

