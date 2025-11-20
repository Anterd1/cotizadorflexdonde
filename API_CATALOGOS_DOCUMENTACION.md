# API de Catálogos - Documentación

## Información General

**Título:** API de Catálogos  
**Versión:** 1.1.0  
**URL Base:** `https://s5mhb5u787.execute-api.us-east-1.amazonaws.com/qa`  
**Autenticación:** API Key en header `x-api-key`  
**API Key:** `unQSy6sApK5bPnIZFiqMZ2NDGgTTzIb6PRpkZ7Y1`

**Contacto:**
- Nombre: Tecnologias de la información
- Email: devprendario@frd.org.mx
- Licencia: Fundacion Rafael Dondé
- URL: https://www.fundaciondonde.org.mx/

---

## Endpoints

### 1. `/simulator/catalog` (POST)

Obtiene catálogos de metales preciosos, diamantes y electrónicos.

#### Catálogos Disponibles:

**Metales Preciosos:**
- `metal_gold_catalog` - Catálogo de Oro
- `metal_silver_catalog` - Catálogo de Plata

**Diamantes:**
- `diamond_color_catalog` - Catálogo de colores de diamantes
- `diamond_clarity_catalog` - Catálogo de claridad de diamantes
- `diamond_size_catalog` - Catálogo de quilataje de diamantes

**Electrónicos:**
- `subcategory_miscellaneous` - Catálogo de electrónicos
- `brand_catalog` - Catálogo de marcas de electrónicos
- `model_catalog` - Catálogo de modelos de electrónicos
- `feature_1_catalog` - Catálogo de características 1
- `feature_2_catalog` - Catálogo de características 2
- `feature_3_catalog` - Catálogo de características 3
- `subcategory_miscellaneous_others` - Catálogo de otros electrónicos

#### Request Body:

```json
{
  "catalog_id": "metal_gold_catalog",
  "data": {
    "user_id": "USR123",
    "prospect_flag": false,
    "id_pledge_lakin": "60",  // Solo para electrónicos
    "brand_id": "",            // Solo para modelos/características
    "model_id": "",            // Solo para características
    "charat1_id": "",          // Solo para características 2 y 3
    "charat2_id": "",          // Solo para características 3
    "charat3_id": ""
  }
}
```

#### Ejemplos de Request:

**Oro:**
```json
{
  "catalog_id": "metal_gold_catalog",
  "data": {
    "user_id": "USR123",
    "prospect_flag": false
  }
}
```

**Plata:**
```json
{
  "catalog_id": "metal_silver_catalog",
  "data": {
    "user_id": "USR123",
    "prospect_flag": false
  }
}
```

**Electrónicos:**
```json
{
  "catalog_id": "subcategory_miscellaneous",
  "data": {
    "user_id": "",
    "prospect_flag": false
  }
}
```

**Marcas (requiere id_pledge_lakin):**
```json
{
  "catalog_id": "brand_catalog",
  "data": {
    "id_pledge_lakin": "60",
    "brand_id": "",
    "model_id": "",
    "charat1_id": "",
    "charat2_id": "",
    "charat3_id": ""
  }
}
```

**Modelos (requiere id_pledge_lakin y brand_id):**
```json
{
  "catalog_id": "model_catalog",
  "data": {
    "id_pledge_lakin": "60",
    "brand_id": "1",
    "model_id": "",
    "charat1_id": "",
    "charat2_id": "",
    "charat3_id": ""
  }
}
```

**Características 1 (requiere id_pledge_lakin, brand_id, model_id):**
```json
{
  "catalog_id": "feature_1_catalog",
  "data": {
    "id_pledge_lakin": "60",
    "brand_id": "1",
    "model_id": "41764",
    "charat1_id": "",
    "charat2_id": "",
    "charat3_id": ""
  }
}
```

**Características 2 (requiere charat1_id):**
```json
{
  "catalog_id": "feature_2_catalog",
  "data": {
    "id_pledge_lakin": "60",
    "brand_id": "1",
    "model_id": "41764",
    "charat1_id": "1479",
    "charat2_id": "",
    "charat3_id": ""
  }
}
```

**Características 3 (requiere charat1_id y charat2_id):**
```json
{
  "catalog_id": "feature_3_catalog",
  "data": {
    "id_pledge_lakin": "60",
    "brand_id": "1",
    "model_id": "41764",
    "charat1_id": "1479",
    "charat2_id": "657",
    "charat3_id": ""
  }
}
```

#### Response Structure:

```json
{
  "catalog": {
    "catalog_id": "metal_gold_catalog",
    "father": "metals",
    "data": [
      {
        "name": "Oro 24k",
        "description": "Oro puro 99.9%",
        "icon": "gold_24k.png",
        "order": "1",
        "child": false,
        "child_ids": [],
        "karat_id": 1,
        "status": 1
      }
    ]
  },
  "show_location": true
}
```

---

### 2. `/simulator/catalog-ext` (POST)

Obtiene catálogos extendidos para vehículos (tipos, años, marcas, modelos y versiones).

#### Catálogos Disponibles:

- `subcategory_vehicles` - Tipos de vehículos (Auto Rodando, Auto Resguardo, Motos)
- `year_vehicles` - Años de vehículos
- `brand_vehicles` - Marcas de vehículos
- `model_vehicles` - Modelos de vehículos
- `version_vehicles` - Versiones de vehículos

**Flujo secuencial:** tipos → años → marcas → modelos → versiones

#### Request Body:

**Tipos de vehículos:**
```json
{
  "catalog_id": "subcategory_vehicles",
  "data": {
    "user_id": "",
    "prospect_flag": false
  }
}
```

**Años (requiere vehicle_type):**
```json
{
  "catalog_id": "year_vehicles",
  "data": {
    "vehicle": "0",
    "brand": "",
    "vehicle_type": "2",
    "model": "",
    "year": ""
  }
}
```

**Marcas (requiere vehicle_type y year):**
```json
{
  "catalog_id": "brand_vehicles",
  "data": {
    "vehicle": "0",
    "brand": "",
    "vehicle_type": "2",
    "model": "",
    "year": "2025"
  }
}
```

**Modelos (requiere vehicle_type, year y brand):**
```json
{
  "catalog_id": "model_vehicles",
  "data": {
    "vehicle": "0",
    "brand": "910",
    "vehicle_type": "2",
    "model": "",
    "year": "2025"
  }
}
```

**Versiones (requiere vehicle_type, year, brand y model):**
```json
{
  "catalog_id": "version_vehicles",
  "data": {
    "vehicle": "0",
    "brand": "910",
    "vehicle_type": "2",
    "model": "810",
    "year": "2025"
  }
}
```

#### Response Structure:

```json
{
  "catalog": {
    "catalog_id": "subcategory_vehicles",
    "father": "category",
    "data": [
      {
        "icon": "auto_rodando",
        "name": "Auto Rodando",
        "description": "Consulta cuánto te prestamos por tu auto y te lo llevas manejando",
        "id_pledge_lakin": "2",
        "child_ids": [
          {
            "name": "vehicle",
            "id": "0"
          },
          {
            "name": "vehicle_type",
            "id": "2"
          }
        ],
        "id_category_lakin": "2",
        "child": "year_vehicles",
        "order": "1",
        "status": "1"
      }
    ]
  },
  "show_location": false
}
```

---

### 3. `/simulator/price` (POST)

Obtiene cotización de metales preciosos, diamantes, electrónicos y vehículos.

#### Request Body:

**Metales:**
```json
{
  "data": {
    "category_id": 1,
    "params": {
      "karat": 14,
      "weight": 8.0
    },
    "pledge_id": 4
  }
}
```

**Diamantes:**
```json
{
  "data": {
    "category_id": 1,
    "params": {
      "amount": 2,
      "clarity_id": 4,
      "colour_id": 5,
      "karats": 0.5,
      "karats_id": 7,
      "old_cut": "1"
    },
    "pledge_id": 11
  }
}
```

**Electrónicos:**
```json
{
  "data": {
    "category_id": 5,
    "params": {
      "feature2_id": "657",
      "brand_id": "126",
      "feature1_id": "1519",
      "model_id": "37637",
      "feature3_id": "93"
    },
    "pledge_id": 69
  }
}
```

**Vehículos:**
```json
{
  "data": {
    "category_id": 6,
    "params": {
      "brand_id": "620",
      "model_id": "2021620592414113",
      "vehicle": "2",
      "version_id": "",
      "year": "2021"
    },
    "pledge_id": 1
  }
}
```

#### Response:

```json
{
  "price": 9500.4
}
```

---

### 4. `/simulator/type-loan` (POST)

Obtiene líneas de préstamo para metales preciosos, diamantes, electrónicos y vehículos.

#### Request Body:

**Metales:**
```json
{
  "data": {
    "category_id": 1,
    "pledge_id": 4,
    "price": 1187.55
  }
}
```

**Diamantes:**
```json
{
  "data": {
    "category_id": 1,
    "pledge_id": 11,
    "price": 1187.55
  }
}
```

**Electrónicos:**
```json
{
  "data": {
    "category_id": 5,
    "pledge_id": 60,
    "price": 2000.0
  }
}
```

**Vehículos (requiere params y location):**
```json
{
  "data": {
    "category_id": 2,
    "pledge_id": 2,
    "params": {
      "year": "2025",
      "brand_id": "910",
      "brand": "Acura",
      "model_id": "810",
      "model": "ADX",
      "version_id": "2025910810100",
      "version": "5p Advance L4/1.5/T Aut"
    },
    "price": 632000.0
  },
  "location": {
    "user_id": "",
    "state": "",
    "delegation": "",
    "colony": "",
    "cp": "",
    "category": "Autos y Motos",
    "category_id": "2"
  }
}
```

#### Response Structure:

```json
{
  "line_products": {
    "products": [
      {
        "product": "Tradicional",
        "frecuencies": [
          {
            "frecuency": "Diario",
            "formatted_loan": "$1,140.00",
            "loan": 1140,
            "formatted_loan_pref": "$1,180.00",
            "loan_pref": 1180,
            "terms": [
              {
                "term": 1,
                "formatted_term": "1 pago diario",
                "payment": 12.77,
                "formatted_payment": "$12.77",
                "last_payment": 1152.77,
                "formatted_last_payment": "$1,152.77",
                "payment_pref": 13.22,
                "formatted_payment_pref": "$13.22",
                "last_payment_pref": 1193.22,
                "formatted_last_payment_pref": "$1,193.22"
              }
            ],
            "price": 1187.55,
            "percent": "96%",
            "percent_pref": "100%",
            "interes_rate": 1.12
          }
        ]
      }
    ]
  },
  "show_location": false,
  "show_procedure": false
}
```

---

## Categorías y Pledge IDs

### Metales y Diamantes (category_id: 1)
- `pledge_id: 4` - Metales preciosos
- `pledge_id: 11` - Diamantes

### Electrónicos (category_id: 5)
- `pledge_id: 60` - Celular
- `pledge_id: 68` - Pantalla
- `pledge_id: 61` - Consola de Videojuego
- `pledge_id: 65` - Laptop
- `pledge_id: 69` - Tableta

### Vehículos
- **Autos (category_id: 2)**
  - `pledge_id: 1` - Auto Resguardo
  - `pledge_id: 2` - Auto Rodando
- **Motos (category_id: 6)**
  - `pledge_id: 1` - Motos

---

## Códigos de Error

- **400:** Solicitud incorrecta - catalog_id no válido
- **401:** No autorizado - API key inválida

---

## Notas Importantes

1. **Autenticación:** Todas las peticiones requieren el header `x-api-key` con el valor de la API key.

2. **Flujo de Catálogos Electrónicos:**
   - Primero obtener `subcategory_miscellaneous` (categorías)
   - Luego `brand_catalog` con `id_pledge_lakin`
   - Luego `model_catalog` con `id_pledge_lakin` y `brand_id`
   - Luego `feature_1_catalog` con `id_pledge_lakin`, `brand_id`, `model_id`
   - Luego `feature_2_catalog` con `charat1_id`
   - Finalmente `feature_3_catalog` con `charat1_id` y `charat2_id`

3. **Flujo de Catálogos Vehículos:**
   - Primero `subcategory_vehicles` (tipos)
   - Luego `year_vehicles` con `vehicle_type`
   - Luego `brand_vehicles` con `vehicle_type` y `year`
   - Luego `model_vehicles` con `vehicle_type`, `year` y `brand`
   - Finalmente `version_vehicles` con `vehicle_type`, `year`, `brand` y `model`

4. **Precios:** El endpoint `/simulator/price` calcula el precio basado en los parámetros específicos de cada categoría.

5. **Líneas de Préstamo:** El endpoint `/simulator/type-loan` requiere el precio calculado previamente y retorna opciones de préstamo con diferentes frecuencias y términos.

