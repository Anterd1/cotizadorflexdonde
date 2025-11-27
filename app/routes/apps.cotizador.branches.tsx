/**
 * App Proxy endpoint para servir las sucursales desde el CSV
 * URL: /apps/cotizador/branches
 */

import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { loadBranchesFromCSV } from "../services/branches.server";

// Función auxiliar para respuestas JSON consistentes
const jsonResponse = (data: any, status = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  console.log("📥 [Branches] GET request recibido en /apps/cotizador/branches");
  
  try {
    // Autenticar la petición del proxy
    await authenticate.public.appProxy(request);
  } catch (error) {
    console.log("⚠️ [Branches] GET sin firma válida (posible acceso directo)");
    // Continuar de todas formas para permitir acceso desde el storefront
  }

  try {
    const activeBranches = await loadBranchesFromCSV();
    return jsonResponse(activeBranches);
  } catch (error) {
    console.error("❌ [Branches] Error cargando sucursales:", error);
    return jsonResponse(
      { 
        error: "Error cargando sucursales",
        details: error instanceof Error ? error.message : String(error)
      },
      500
    );
  }
};


