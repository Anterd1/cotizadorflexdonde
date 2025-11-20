/**
 * Servicio para consumir la API externa de artículos/productos
 */

import type { ExternalProduct } from "../types/quote.types";

/**
 * Configuración de la API externa
 */
function getApiConfig() {
  const apiUrl = process.env.EXTERNAL_API_URL;
  const apiKey = process.env.EXTERNAL_API_KEY;

  if (!apiUrl) {
    throw new Error("Falta variable de entorno: EXTERNAL_API_URL");
  }

  return { apiUrl, apiKey };
}

/**
 * Busca productos en la API externa
 */
export async function searchProducts(
  searchTerm?: string,
  limit: number = 50
): Promise<ExternalProduct[]> {
  const { apiUrl, apiKey } = getApiConfig();

  try {
    const url = new URL(`${apiUrl}/products`);
    if (searchTerm) {
      url.searchParams.append("search", searchTerm);
    }
    url.searchParams.append("limit", limit.toString());

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
      // O si usa otro tipo de autenticación:
      // headers["X-API-Key"] = apiKey;
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error(`API externa error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Adaptar la respuesta según la estructura real de la API
    // Esta es una estructura genérica, ajustar según la API real
    if (Array.isArray(data)) {
      return data.map((item) => ({
        id: item.id || item._id || String(item.code),
        code: item.code || item.sku || item.productCode,
        name: item.name || item.title || item.productName,
        description: item.description || "",
        price: parseFloat(item.price || item.cost || 0),
        ...item, // Incluir otros campos que pueda tener
      }));
    }

    // Si la API devuelve un objeto con una propiedad "data" o "products"
    if (data.data && Array.isArray(data.data)) {
      return data.data.map((item: unknown) => ({
        id: (item as { id?: string }).id || "",
        code: (item as { code?: string }).code || "",
        name: (item as { name?: string }).name || "",
        description: (item as { description?: string }).description || "",
        price: parseFloat((item as { price?: number | string }).price?.toString() || "0"),
      }));
    }

    if (data.products && Array.isArray(data.products)) {
      return data.products.map((item: unknown) => ({
        id: (item as { id?: string }).id || "",
        code: (item as { code?: string }).code || "",
        name: (item as { name?: string }).name || "",
        description: (item as { description?: string }).description || "",
        price: parseFloat((item as { price?: number | string }).price?.toString() || "0"),
      }));
    }

    return [];
  } catch (error) {
    console.error("Error buscando productos en API externa:", error);
    throw error;
  }
}

/**
 * Obtiene un producto específico por ID
 */
export async function getProductById(productId: string): Promise<ExternalProduct | null> {
  const { apiUrl, apiKey } = getApiConfig();

  try {
    const url = new URL(`${apiUrl}/products/${productId}`);

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`API externa error: ${response.status} ${response.statusText}`);
    }

    const item = await response.json();

    return {
      id: item.id || item._id || String(item.code),
      code: item.code || item.sku || item.productCode,
      name: item.name || item.title || item.productName,
      description: item.description || "",
      price: parseFloat(item.price || item.cost || 0),
      ...item,
    };
  } catch (error) {
    console.error(`Error obteniendo producto ${productId}:`, error);
    return null;
  }
}

// La función externalProductToQuoteItem fue movida a app/utils/product-utils.ts
// para poder ser usada tanto en cliente como en servidor

