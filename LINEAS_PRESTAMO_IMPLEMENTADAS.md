# Líneas de Préstamo - Implementación

## Funcionalidad Implementada

Las líneas de préstamo ahora se muestran automáticamente después de que el cliente selecciona un producto y se calcula su precio.

## Cómo Funciona

### 1. Flujo Automático

Cuando un cliente selecciona un producto del catálogo:

1. ✅ Se calcula el precio (`/simulator/price`)
2. ✅ **Se obtienen las líneas de préstamo automáticamente** (`/simulator/type-loan`)
3. ✅ Se muestra una sección "Opciones de Préstamo"
4. ✅ El cliente puede seleccionar una opción

### 2. Opciones Mostradas

**Productos de Préstamo:**
- **Tradicional**: Préstamo tradicional con intereses estándar
- **Pagos Fijos**: Préstamo con cuotas fijas

**Para cada producto se muestran:**
- **Frecuencias**: Diario, Semanal, Catorcenal, Mensual
- **Monto del préstamo**: Ejemplo: $14,350.00 (70%)
- **Monto preferente**: Ejemplo: $15,785.00 (70%, +10%)

**Para cada frecuencia se muestran:**
- **Términos**: Opciones de cantidad de pagos
  - Ejemplo: "6 pagos mensuales: $2,500.00"
  - Ejemplo: "12 pagos mensuales: $1,350.00"

### 3. Selección

El cliente hace clic en la opción deseada (radio button).

Cada opción muestra:
- Término (ej: "6 pagos mensuales")
- Pago normal (ej: "$2,500.00")
- Pago preferente (si aplica) (ej: "$2,750.00")

### 4. Información Guardada

Cuando el cliente selecciona una opción, se guarda:

```json
{
  "key": "0-0-0",
  "product": "Tradicional",
  "frequency": "Mensual",
  "term": {
    "term": 6,
    "formatted_term": "6 pagos mensuales",
    "payment": 2500.00,
    "formatted_payment": "$2,500.00",
    "last_payment": 2500.00,
    "formatted_last_payment": "$2,500.00",
    "payment_pref": 2750.00,
    "formatted_payment_pref": "$2,750.00",
    "last_payment_pref": 2750.00,
    "formatted_last_payment_pref": "$2,750.00"
  }
}
```

### 5. Envío al Backend

Esta información se envía en el campo `selectedLoan` del formulario y se incluye en las **notas** de la cotización guardada en Shopify:

```
Opción de Préstamo Seleccionada:
- Producto: Tradicional
- Frecuencia: Mensual
- Término: 6 pagos mensuales
- Pago: $2,500.00
- Último pago: $2,500.00
- Pago preferente: $2,750.00
- Último pago preferente: $2,750.00
```

## Estilos Interactivos

Las opciones de préstamo tienen:
- ✅ Borde que cambia de color al hacer hover
- ✅ Fondo que cambia cuando se selecciona
- ✅ Colores configurables desde el editor de temas
- ✅ Responsive (se adapta a móviles)

## Ejemplo Visual

```
Opciones de Préstamo:

┌─────────────────────────────────────────────┐
│ Tradicional                                 │
│                                             │
│ Frecuencia: Mensual                         │
│ Préstamo: $14,350.00 (70%)                  │
│ Préstamo preferente: $15,785.00 (70%, +10%) │
│                                             │
│ ┌──────────────────┐ ┌──────────────────┐  │
│ │ ☑ 6 pagos        │ │ ○ 12 pagos       │  │
│ │   mensuales      │ │   mensuales      │  │
│ │   Pago: $2,500   │ │   Pago: $1,350   │  │
│ │   Pref: $2,750   │ │   Pref: $1,485   │  │
│ └──────────────────┘ └──────────────────┘  │
└─────────────────────────────────────────────┘
```

## Consideraciones Especiales

### Para Vehículos

Los vehículos requieren información adicional de ubicación:
- Estado
- Delegación
- Colonia
- Código Postal

Por ahora, se envían vacíos. Si necesitas capturar esta información, agrégala al formulario.

### Líneas de Préstamo Opcionales

- Si la API de `/simulator/type-loan` falla, no se bloquea el flujo
- El cliente puede continuar sin seleccionar una opción de préstamo
- Las líneas de préstamo se resetean si se eliminan todos los productos

## Deploy

Para aplicar estos cambios:

```bash
cd /Users/mac/cotizadorv3/cotizadorv3
shopify app deploy
```

Después:
1. Refresca el editor de temas
2. Recarga el preview (Cmd + Shift + R)
3. Prueba seleccionando un producto
4. Verás las opciones de préstamo aparecer automáticamente

