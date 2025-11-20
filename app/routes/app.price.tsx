/**
 * Endpoint para obtener precios y líneas de préstamo de la API de Catálogos
 * Ruta: /app/price
 */

import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { getPrice, getLoanTypes } from "../services/catalog-api.server";
import { boundary } from "@shopify/shopify-app-react-router/server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    await authenticate.admin(request);
    
    const url = new URL(request.url);
    const action = url.searchParams.get("action"); // "price" o "loan-types"

    if (action === "price") {
      // Obtener precio
      const categoryId = parseInt(url.searchParams.get("category_id") || "0");
      const pledgeId = parseInt(url.searchParams.get("pledge_id") || "0");

      if (!categoryId || !pledgeId) {
        return new Response(
          JSON.stringify({ error: "Se requieren 'category_id' y 'pledge_id'" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Obtener parámetros según la categoría
      let params: any = {};

      if (categoryId === 1) {
        // Metales o diamantes
        const karat = url.searchParams.get("karat");
        const weight = url.searchParams.get("weight");
        const amount = url.searchParams.get("amount");
        const clarity_id = url.searchParams.get("clarity_id");
        const colour_id = url.searchParams.get("colour_id");
        const karats = url.searchParams.get("karats");
        const karats_id = url.searchParams.get("karats_id");
        const old_cut = url.searchParams.get("old_cut");

        if (pledgeId === 4) {
          // Metales
          params = {
            karat: karat ? parseInt(karat) : undefined,
            weight: weight ? parseFloat(weight) : undefined,
          };
        } else if (pledgeId === 11) {
          // Diamantes
          params = {
            amount: amount ? parseInt(amount) : undefined,
            clarity_id: clarity_id ? parseInt(clarity_id) : undefined,
            colour_id: colour_id ? parseInt(colour_id) : undefined,
            karats: karats ? parseFloat(karats) : undefined,
            karats_id: karats_id ? parseInt(karats_id) : undefined,
            old_cut: old_cut || "0",
          };
        }
      } else if (categoryId === 5) {
        // Electrónicos
        params = {
          brand_id: url.searchParams.get("brand_id") || "",
          model_id: url.searchParams.get("model_id") || "",
          feature1_id: url.searchParams.get("feature1_id") || "",
          feature2_id: url.searchParams.get("feature2_id") || "",
          feature3_id: url.searchParams.get("feature3_id") || "",
        };
      } else if (categoryId === 2 || categoryId === 6) {
        // Vehículos
        params = {
          vehicle: url.searchParams.get("vehicle") || "",
          brand_id: url.searchParams.get("brand_id") || "",
          model_id: url.searchParams.get("model_id") || "",
          version_id: url.searchParams.get("version_id") || "",
          year: url.searchParams.get("year") || "",
        };
      }

      const price = await getPrice(categoryId, pledgeId, params);

      return new Response(JSON.stringify({ price }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } else if (action === "loan-types") {
      // Obtener líneas de préstamo
      const categoryId = parseInt(url.searchParams.get("category_id") || "0");
      const pledgeId = parseInt(url.searchParams.get("pledge_id") || "0");
      const price = parseFloat(url.searchParams.get("price") || "0");

      if (!categoryId || !pledgeId || !price) {
        return new Response(
          JSON.stringify({ error: "Se requieren 'category_id', 'pledge_id' y 'price'" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      let params: any = undefined;
      let location: any = undefined;

      // Para vehículos, obtener params y location
      if (categoryId === 2 || categoryId === 6) {
        params = {
          vehicle: url.searchParams.get("vehicle") || "",
          brand_id: url.searchParams.get("brand_id") || "",
          model_id: url.searchParams.get("model_id") || "",
          version_id: url.searchParams.get("version_id") || "",
          year: url.searchParams.get("year") || "",
        };

        location = {
          user_id: url.searchParams.get("user_id") || "",
          state: url.searchParams.get("state") || "",
          delegation: url.searchParams.get("delegation") || "",
          colony: url.searchParams.get("colony") || "",
          cp: url.searchParams.get("cp") || "",
          category: url.searchParams.get("category") || "",
          category_id: url.searchParams.get("category_id") || "",
        };
      }

      const loanTypes = await getLoanTypes(categoryId, pledgeId, price, params, location);

      return new Response(JSON.stringify(loanTypes), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } else {
      return new Response(
        JSON.stringify({ error: "Se requiere parámetro 'action' (price o loan-types)" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Error obteniendo precio/líneas de préstamo:", error);
    return new Response(
      JSON.stringify({
        error: "Error obteniendo precio/líneas de préstamo",
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
  return boundary.error(new Error("Error obteniendo precio"));
}

