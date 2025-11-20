/**
 * Endpoint para obtener catálogos de la API de Catálogos
 * Ruta: /app/catalog
 */

import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { getCatalog, getCatalogExt, type CatalogId, type CatalogExtId } from "../services/catalog-api.server";
import { boundary } from "@shopify/shopify-app-react-router/server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    await authenticate.admin(request);
    
    const url = new URL(request.url);
    const catalogId = url.searchParams.get("catalog_id");
    const catalogType = url.searchParams.get("type"); // "standard" o "ext"

    if (!catalogId) {
      return new Response(
        JSON.stringify({ error: "Se requiere parámetro 'catalog_id'" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Obtener parámetros adicionales
    const user_id = url.searchParams.get("user_id") || "";
    const prospect_flag = url.searchParams.get("prospect_flag") === "true";
    const id_pledge_lakin = url.searchParams.get("id_pledge_lakin") || "";
    const brand_id = url.searchParams.get("brand_id") || "";
    const model_id = url.searchParams.get("model_id") || "";
    const charat1_id = url.searchParams.get("charat1_id") || "";
    const charat2_id = url.searchParams.get("charat2_id") || "";
    const charat3_id = url.searchParams.get("charat3_id") || "";
    
    // Parámetros para catálogos extendidos (vehículos)
    const vehicle = url.searchParams.get("vehicle") || "";
    const vehicle_type = url.searchParams.get("vehicle_type") || "";
    const year = url.searchParams.get("year") || "";
    const brand = url.searchParams.get("brand") || "";
    const model = url.searchParams.get("model") || "";

    if (catalogType === "ext") {
      // Catálogo extendido (vehículos)
      const catalogExt = await getCatalogExt(catalogId as CatalogExtId, {
        user_id,
        prospect_flag,
        vehicle,
        brand,
        vehicle_type,
        model,
        year,
      });

      return new Response(JSON.stringify(catalogExt), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } else {
      // Catálogo estándar
      const catalog = await getCatalog(catalogId as CatalogId, {
        user_id,
        prospect_flag,
        id_pledge_lakin,
        brand_id,
        model_id,
        charat1_id,
        charat2_id,
        charat3_id,
      });

      return new Response(JSON.stringify(catalog), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("Error obteniendo catálogo:", error);
    return new Response(
      JSON.stringify({
        error: "Error obteniendo catálogo",
        message: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  // También permitir POST para compatibilidad
  return loader({ request } as LoaderFunctionArgs);
};

export function ErrorBoundary() {
  return boundary.error(new Error("Error cargando catálogo"));
}

