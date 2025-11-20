# Ejemplos de Uso - API de Catálogos

Este documento muestra cómo usar la API de Catálogos integrada en el sistema de cotizaciones.

## Endpoints Disponibles

### 1. Obtener Catálogos

#### Catálogo Estándar (Metales, Diamantes, Electrónicos)

**Endpoint:** `/app/catalog`

**Parámetros:**
- `catalog_id` (requerido): ID del catálogo a obtener
- `type` (opcional): `"standard"` o `"ext"` (default: `"standard"`)
- `user_id` (opcional): ID del usuario
- `prospect_flag` (opcional): `true` o `false`
- `id_pledge_lakin` (opcional): Para catálogos de electrónicos
- `brand_id` (opcional): Para modelos y características
- `model_id` (opcional): Para características
- `charat1_id` (opcional): Para características 2 y 3
- `charat2_id` (opcional): Para características 3
- `charat3_id` (opcional)

**Ejemplos:**

```javascript
// Obtener catálogo de Oro
fetch('/app/catalog?catalog_id=metal_gold_catalog')
  .then(res => res.json())
  .then(data => console.log(data));

// Obtener catálogo de Plata
fetch('/app/catalog?catalog_id=metal_silver_catalog')
  .then(res => res.json())
  .then(data => console.log(data));

// Obtener catálogo de electrónicos
fetch('/app/catalog?catalog_id=subcategory_miscellaneous')
  .then(res => res.json())
  .then(data => console.log(data));

// Obtener marcas de electrónicos (requiere id_pledge_lakin)
fetch('/app/catalog?catalog_id=brand_catalog&id_pledge_lakin=60')
  .then(res => res.json())
  .then(data => console.log(data));

// Obtener modelos (requiere id_pledge_lakin y brand_id)
fetch('/app/catalog?catalog_id=model_catalog&id_pledge_lakin=60&brand_id=1')
  .then(res => res.json())
  .then(data => console.log(data));

// Obtener características 1 (requiere id_pledge_lakin, brand_id, model_id)
fetch('/app/catalog?catalog_id=feature_1_catalog&id_pledge_lakin=60&brand_id=1&model_id=41764')
  .then(res => res.json())
  .then(data => console.log(data));
```

#### Catálogo Extendido (Vehículos)

**Parámetros adicionales:**
- `vehicle` (opcional): Tipo de vehículo
- `vehicle_type` (opcional): Tipo de vehículo (para años)
- `year` (opcional): Año (para marcas, modelos, versiones)
- `brand` (opcional): Marca (para modelos, versiones)
- `model` (opcional): Modelo (para versiones)

**Ejemplos:**

```javascript
// Obtener tipos de vehículos
fetch('/app/catalog?catalog_id=subcategory_vehicles&type=ext')
  .then(res => res.json())
  .then(data => console.log(data));

// Obtener años de vehículos (requiere vehicle_type)
fetch('/app/catalog?catalog_id=year_vehicles&type=ext&vehicle_type=2')
  .then(res => res.json())
  .then(data => console.log(data));

// Obtener marcas de vehículos (requiere vehicle_type y year)
fetch('/app/catalog?catalog_id=brand_vehicles&type=ext&vehicle_type=2&year=2025')
  .then(res => res.json())
  .then(data => console.log(data));

// Obtener modelos (requiere vehicle_type, year y brand)
fetch('/app/catalog?catalog_id=model_vehicles&type=ext&vehicle_type=2&year=2025&brand=910')
  .then(res => res.json())
  .then(data => console.log(data));

// Obtener versiones (requiere vehicle_type, year, brand y model)
fetch('/app/catalog?catalog_id=version_vehicles&type=ext&vehicle_type=2&year=2025&brand=910&model=810')
  .then(res => res.json())
  .then(data => console.log(data));
```

---

### 2. Obtener Precios

**Endpoint:** `/app/price?action=price`

**Parámetros requeridos:**
- `action`: `"price"`
- `category_id`: ID de la categoría (1=metales/diamantes, 5=electrónicos, 2/6=vehículos)
- `pledge_id`: ID del tipo de préstamo

**Parámetros según categoría:**

**Metales (category_id=1, pledge_id=4):**
- `karat`: Kilates (10, 14, 18, 24, etc.)
- `weight`: Peso en gramos

**Diamantes (category_id=1, pledge_id=11):**
- `amount`: Cantidad de diamantes
- `clarity_id`: ID de claridad
- `colour_id`: ID de color
- `karats`: Quilates totales
- `karats_id`: ID del rango de quilates
- `old_cut`: "1" o "0"

**Electrónicos (category_id=5):**
- `pledge_id`: 60 (Celular), 68 (Pantalla), 61 (Consola), 65 (Laptop), 69 (Tableta)
- `brand_id`: ID de la marca
- `model_id`: ID del modelo
- `feature1_id`: ID de característica 1 (opcional)
- `feature2_id`: ID de característica 2 (opcional)
- `feature3_id`: ID de característica 3 (opcional)

**Vehículos (category_id=2 o 6):**
- `pledge_id`: 1 (Auto Resguardo/Motos), 2 (Auto Rodando)
- `vehicle`: Tipo de vehículo
- `brand_id`: ID de la marca
- `model_id`: ID del modelo
- `version_id`: ID de la versión (opcional)
- `year`: Año del vehículo

**Ejemplos:**

```javascript
// Precio de metal (Oro 14k, 8 gramos)
fetch('/app/price?action=price&category_id=1&pledge_id=4&karat=14&weight=8.0')
  .then(res => res.json())
  .then(data => console.log('Precio:', data.price));

// Precio de diamante
fetch('/app/price?action=price&category_id=1&pledge_id=11&amount=2&clarity_id=4&colour_id=5&karats=0.5&karats_id=7&old_cut=1')
  .then(res => res.json())
  .then(data => console.log('Precio:', data.price));

// Precio de electrónico (Celular)
fetch('/app/price?action=price&category_id=5&pledge_id=60&brand_id=126&model_id=37637&feature1_id=1519&feature2_id=657&feature3_id=93')
  .then(res => res.json())
  .then(data => console.log('Precio:', data.price));

// Precio de vehículo
fetch('/app/price?action=price&category_id=2&pledge_id=2&vehicle=2&brand_id=620&model_id=2021620592414113&year=2021')
  .then(res => res.json())
  .then(data => console.log('Precio:', data.price));
```

---

### 3. Obtener Líneas de Préstamo

**Endpoint:** `/app/price?action=loan-types`

**Parámetros requeridos:**
- `action`: `"loan-types"`
- `category_id`: ID de la categoría
- `pledge_id`: ID del tipo de préstamo
- `price`: Precio calculado previamente

**Parámetros adicionales para vehículos:**
- `vehicle`: Tipo de vehículo
- `brand_id`: ID de la marca
- `model_id`: ID del modelo
- `version_id`: ID de la versión (opcional)
- `year`: Año del vehículo
- `user_id`, `state`, `delegation`, `colony`, `cp`, `category`, `category_id`: Datos de ubicación (opcionales)

**Ejemplos:**

```javascript
// Líneas de préstamo para metales
fetch('/app/price?action=loan-types&category_id=1&pledge_id=4&price=1187.55')
  .then(res => res.json())
  .then(data => console.log('Líneas de préstamo:', data));

// Líneas de préstamo para electrónicos
fetch('/app/price?action=loan-types&category_id=5&pledge_id=60&price=2000.0')
  .then(res => res.json())
  .then(data => console.log('Líneas de préstamo:', data));

// Líneas de préstamo para vehículos (con params y location)
fetch('/app/price?action=loan-types&category_id=2&pledge_id=2&price=632000.0&vehicle=2&brand_id=910&model_id=810&year=2025&state=CDMX&delegation=Benito+Juarez')
  .then(res => res.json())
  .then(data => console.log('Líneas de préstamo:', data));
```

---

## Flujo Completo de Ejemplo

### Ejemplo 1: Cotización de Oro

```javascript
// 1. Obtener catálogo de oro
const catalogResponse = await fetch('/app/catalog?catalog_id=metal_gold_catalog');
const catalog = await catalogResponse.json();
console.log('Opciones de oro:', catalog.catalog.data);

// 2. Usuario selecciona: Oro 14k, 8 gramos
// 3. Obtener precio
const priceResponse = await fetch('/app/price?action=price&category_id=1&pledge_id=4&karat=14&weight=8.0');
const priceData = await priceResponse.json();
console.log('Precio calculado:', priceData.price);

// 4. Obtener líneas de préstamo
const loanResponse = await fetch(`/app/price?action=loan-types&category_id=1&pledge_id=4&price=${priceData.price}`);
const loanData = await loanResponse.json();
console.log('Opciones de préstamo:', loanData.line_products);
```

### Ejemplo 2: Cotización de Electrónico (Celular)

```javascript
// 1. Obtener categorías de electrónicos
const categoriesResponse = await fetch('/app/catalog?catalog_id=subcategory_miscellaneous');
const categories = await categoriesResponse.json();
console.log('Categorías:', categories.catalog.data);

// 2. Usuario selecciona: Celular (id_pledge_lakin: 60)
// 3. Obtener marcas
const brandsResponse = await fetch('/app/catalog?catalog_id=brand_catalog&id_pledge_lakin=60');
const brands = await brandsResponse.json();
console.log('Marcas:', brands.catalog.data);

// 4. Usuario selecciona: APPLE (brand_id: 161)
// 5. Obtener modelos
const modelsResponse = await fetch('/app/catalog?catalog_id=model_catalog&id_pledge_lakin=60&brand_id=161');
const models = await modelsResponse.json();
console.log('Modelos:', models.catalog.data);

// 6. Usuario selecciona un modelo (model_id: 37637)
// 7. Obtener características 1
const features1Response = await fetch('/app/catalog?catalog_id=feature_1_catalog&id_pledge_lakin=60&brand_id=161&model_id=37637');
const features1 = await features1Response.json();
console.log('Características 1:', features1.catalog.data);

// 8. Continuar con características 2 y 3...
// 9. Una vez completado, obtener precio
const priceResponse = await fetch('/app/price?action=price&category_id=5&pledge_id=60&brand_id=161&model_id=37637&feature1_id=1519&feature2_id=657&feature3_id=93');
const priceData = await priceResponse.json();
console.log('Precio:', priceData.price);

// 10. Obtener líneas de préstamo
const loanResponse = await fetch(`/app/price?action=loan-types&category_id=5&pledge_id=60&price=${priceData.price}`);
const loanData = await loanResponse.json();
console.log('Opciones de préstamo:', loanData.line_products);
```

### Ejemplo 3: Cotización de Vehículo

```javascript
// 1. Obtener tipos de vehículos
const typesResponse = await fetch('/app/catalog?catalog_id=subcategory_vehicles&type=ext');
const types = await typesResponse.json();
console.log('Tipos:', types.catalog.data);

// 2. Usuario selecciona: Auto Rodando (vehicle_type: 2)
// 3. Obtener años
const yearsResponse = await fetch('/app/catalog?catalog_id=year_vehicles&type=ext&vehicle_type=2');
const years = await yearsResponse.json();
console.log('Años:', years.catalog.data);

// 4. Usuario selecciona: 2025
// 5. Obtener marcas
const brandsResponse = await fetch('/app/catalog?catalog_id=brand_vehicles&type=ext&vehicle_type=2&year=2025');
const brands = await brandsResponse.json();
console.log('Marcas:', brands.catalog.data);

// 6. Usuario selecciona: Acura (brand: 910)
// 7. Obtener modelos
const modelsResponse = await fetch('/app/catalog?catalog_id=model_vehicles&type=ext&vehicle_type=2&year=2025&brand=910');
const models = await modelsResponse.json();
console.log('Modelos:', models.catalog.data);

// 8. Usuario selecciona: ADX (model: 810)
// 9. Obtener versiones
const versionsResponse = await fetch('/app/catalog?catalog_id=version_vehicles&type=ext&vehicle_type=2&year=2025&brand=910&model=810');
const versions = await versionsResponse.json();
console.log('Versiones:', versions.catalog.data);

// 10. Usuario selecciona una versión (version_id: 2025910810100)
// 11. Obtener precio
const priceResponse = await fetch('/app/price?action=price&category_id=2&pledge_id=2&vehicle=2&brand_id=910&model_id=810&version_id=2025910810100&year=2025');
const priceData = await priceResponse.json();
console.log('Precio:', priceData.price);

// 12. Obtener líneas de préstamo (con ubicación)
const loanResponse = await fetch(`/app/price?action=loan-types&category_id=2&pledge_id=2&price=${priceData.price}&vehicle=2&brand_id=910&model_id=810&year=2025&state=CDMX&delegation=Benito+Juarez`);
const loanData = await loanResponse.json();
console.log('Opciones de préstamo:', loanData.line_products);
```

---

## Integración en el Formulario de Cotización

Para integrar estos endpoints en el formulario de cotización, puedes:

1. **Agregar selectores de catálogo** en `app/routes/app.quotes.new.tsx`
2. **Usar los endpoints** para cargar opciones dinámicamente
3. **Calcular precios automáticamente** cuando el usuario seleccione opciones
4. **Mostrar líneas de préstamo** después de calcular el precio

¿Quieres que implemente la integración completa en el formulario de cotización?

