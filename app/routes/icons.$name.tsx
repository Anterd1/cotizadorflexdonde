import type { LoaderFunctionArgs } from "react-router";
import { readFile } from "fs/promises";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const iconName = params.name;
  
  // Logs para debug
  console.log(`🔍 [ICONS ROUTE] Loading icon: ${iconName}`);
  console.log(`🔍 [ICONS ROUTE] Request URL: ${request.url}`);
  console.log(`📂 [ICONS ROUTE] Current working directory: ${process.cwd()}`);
  console.log(`📂 [ICONS ROUTE] __dirname: ${__dirname}`);
  
  if (!iconName) {
    console.error(`❌ [ICONS ROUTE] No icon name provided`);
    return new Response("Icon name required", { status: 400 });
  }
  
  // Aceptar con o sin .png
  const finalIconName = iconName.endsWith('.png') ? iconName : `${iconName}.png`;

  try {
    // Intentar diferentes rutas posibles
    const possiblePaths = [
      join(process.cwd(), "public", "icons", finalIconName),
      join(process.cwd(), "cotizadorv3", "public", "icons", finalIconName),
      join(__dirname, "..", "..", "public", "icons", finalIconName),
      join(__dirname, "..", "..", "..", "public", "icons", finalIconName),
    ];
    
    let iconBuffer: Buffer | null = null;
    let successfulPath: string | null = null;
    
    for (const iconPath of possiblePaths) {
      try {
        console.log(`🔍 [ICONS ROUTE] Trying path: ${iconPath}`);
        iconBuffer = await readFile(iconPath);
        successfulPath = iconPath;
        console.log(`✅ [ICONS ROUTE] Icon loaded successfully from: ${iconPath}`);
        break;
      } catch (err) {
        const error = err as Error;
        console.log(`❌ [ICONS ROUTE] Failed to load from: ${iconPath} - ${error.message}`);
      }
    }
    
    if (!iconBuffer || !successfulPath) {
      console.error(`❌ [ICONS ROUTE] All paths failed for icon: ${finalIconName}`);
      console.error(`❌ [ICONS ROUTE] Tried paths:`, possiblePaths);
      return new Response(`Icon not found: ${finalIconName}`, { status: 404 });
    }
    
    return new Response(iconBuffer as any, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("❌ Error loading icon:", error);
    return new Response("Internal server error", { status: 500 });
  }
};

