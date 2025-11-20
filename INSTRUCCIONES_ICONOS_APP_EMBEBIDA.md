# Instrucciones para Agregar Iconos 3D a la App Embebida

## Pasos para Exportar los Iconos desde Figma

1. **Abre el diseño en Figma:**
   - Ve a: https://www.figma.com/design/jioqQ0JsjVtuqZRHEeUOHN/PlayGround?node-id=241-398

2. **Para cada ícono (10 en total):**
   - Selecciona el ícono 3D de cada categoría
   - Click derecho → "Export" o usa el panel de exportación
   - Exporta como PNG con estas especificaciones:
     - Tamaño: 90.7879px x 90.7879px (o 2x para retina: 181.5758px)
     - Formato: PNG
     - Nombre según la categoría (ver lista abajo)

3. **Nombres de archivos requeridos:**
   - `icon-alhajas.png` - Alhajas
   - `icon-relojes.png` - Relojes
   - `icon-celulares.png` - Celulares
   - `icon-laptops.png` - Laptops
   - `icon-autos-motos.png` - Autos y Motos
   - `icon-tablets.png` - Tablets
   - `icon-smartwatch.png` - Smartwatch
   - `icon-consolas.png` - Consolas
   - `icon-otros.png` - Otros
   - `icon-financiamiento-auto.png` - Financiamiento para tu auto

4. **Colocar los archivos:**
   - Copia los 10 archivos PNG a la carpeta: `/Users/mac/cotizadorv3/cotizadorv3/public/icons/`
   - O ejecuta: `cp icon-*.png /Users/mac/cotizadorv3/cotizadorv3/public/icons/`

5. **Verificar:**
   - Los iconos se cargarán automáticamente desde `/icons/icon-{tipo}.png`
   - Si un icono no existe, se mostrará un emoji como fallback

## Comando para copiar iconos (si ya los tienes en otra ubicación):

```bash
# Desde la carpeta donde están los iconos exportados
cp icon-*.png /Users/mac/cotizadorv3/cotizadorv3/public/icons/
```

## Nota
El componente `CategoryIcon` ya está configurado para:
- Intentar cargar la imagen desde `/icons/icon-{tipo}.png`
- Mostrar un emoji como fallback si la imagen no existe
- Usar el tamaño correcto (90.7879px) según el diseño de Figma

