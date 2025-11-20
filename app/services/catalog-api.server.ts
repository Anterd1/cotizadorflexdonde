/**
 * Servicio para consumir la API de Catálogos
 * API para consulta de catálogos de metales preciosos, diamantes, electrónicos y vehículos
 */

/**
 * Configuración de la API de Catálogos
 */
function getCatalogApiConfig() {
  const apiUrl = process.env.CATALOG_API_URL || "https://s5mhb5u787.execute-api.us-east-1.amazonaws.com/qa";
  const apiKey = process.env.CATALOG_API_KEY || "unQSy6sApK5bPnIZFiqMZ2NDGgTTzIb6PRpkZ7Y1";

  return { apiUrl, apiKey };
}

/**
 * Tipos de catálogos disponibles
 */
export type CatalogId =
  // Metales
  | "metal_gold_catalog"
  | "metal_silver_catalog"
  // Diamantes
  | "diamond_color_catalog"
  | "diamond_clarity_catalog"
  | "diamond_size_catalog"
  // Electrónicos
  | "subcategory_miscellaneous"
  | "brand_catalog"
  | "model_catalog"
  | "feature_1_catalog"
  | "feature_2_catalog"
  | "feature_3_catalog"
  | "subcategory_miscellaneous_others";

export type CatalogExtId =
  | "subcategory_vehicles"
  | "year_vehicles"
  | "brand_vehicles"
  | "model_vehicles"
  | "version_vehicles";

/**
 * Estructura de datos para solicitar catálogos
 */
export interface CatalogRequestData {
  user_id?: string;
  prospect_flag?: boolean;
  id_pledge_lakin?: string;
  brand_id?: string;
  model_id?: string;
  charat1_id?: string;
  charat2_id?: string;
  charat3_id?: string;
}

export interface CatalogExtRequestData {
  user_id?: string;
  prospect_flag?: boolean;
  vehicle?: string;
  brand?: string;
  vehicle_type?: string;
  model?: string;
  year?: string;
}

/**
 * Respuesta de catálogo
 */
export interface CatalogResponse {
  catalog: {
    catalog_id: string;
    father: string;
    data: any[];
  };
  show_location: boolean;
}

/**
 * Obtiene un catálogo del endpoint /simulator/catalog
 */
export async function getCatalog(
  catalogId: CatalogId,
  data: CatalogRequestData = {}
): Promise<CatalogResponse> {
  const { apiUrl, apiKey } = getCatalogApiConfig();

  try {
    const response = await fetch(`${apiUrl}/simulator/catalog`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        catalog_id: catalogId,
        data: {
          user_id: data.user_id || "",
          prospect_flag: data.prospect_flag ?? false,
          id_pledge_lakin: data.id_pledge_lakin || "",
          brand_id: data.brand_id || "",
          model_id: data.model_id || "",
          charat1_id: data.charat1_id || "",
          charat2_id: data.charat2_id || "",
          charat3_id: data.charat3_id || "",
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API de catálogos error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error(`Error obteniendo catálogo ${catalogId}:`, error);
    throw error;
  }
}

/**
 * Obtiene un catálogo extendido del endpoint /simulator/catalog-ext
 */
export async function getCatalogExt(
  catalogId: CatalogExtId,
  data: CatalogExtRequestData = {}
): Promise<CatalogResponse> {
  const { apiUrl, apiKey } = getCatalogApiConfig();

  try {
    const response = await fetch(`${apiUrl}/simulator/catalog-ext`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        catalog_id: catalogId,
        data: {
          user_id: data.user_id || "",
          prospect_flag: data.prospect_flag ?? false,
          vehicle: data.vehicle || "",
          brand: data.brand || "",
          vehicle_type: data.vehicle_type || "",
          model: data.model || "",
          year: data.year || "",
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API de catálogos extendidos error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error(`Error obteniendo catálogo extendido ${catalogId}:`, error);
    throw error;
  }
}

/**
 * Parámetros para cotización de metales
 */
export interface MetalsPriceParams {
  karat: number;
  weight: number;
}

/**
 * Parámetros para cotización de diamantes
 */
export interface DiamondsPriceParams {
  amount: number;
  clarity_id: number;
  colour_id: number;
  karats: number;
  karats_id: number;
  old_cut: string;
}

/**
 * Parámetros para cotización de electrónicos
 */
export interface ElectronicsPriceParams {
  brand_id: string;
  model_id: string;
  feature1_id?: string;
  feature2_id?: string;
  feature3_id?: string;
}

/**
 * Parámetros para cotización de vehículos
 */
export interface VehiclesPriceParams {
  vehicle: string;
  brand_id: string;
  model_id: string;
  version_id?: string;
  year: string;
}

/**
 * Obtiene el precio de un producto
 */
export async function getPrice(
  categoryId: number,
  pledgeId: number,
  params: MetalsPriceParams | DiamondsPriceParams | ElectronicsPriceParams | VehiclesPriceParams
): Promise<number> {
  const { apiUrl, apiKey } = getCatalogApiConfig();

  try {
    const response = await fetch(`${apiUrl}/simulator/price`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        data: {
          category_id: categoryId,
          pledge_id: pledgeId,
          params,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API de precios error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    return result.price || 0;
  } catch (error) {
    console.error("Error obteniendo precio:", error);
    throw error;
  }
}

/**
 * Obtiene las líneas de préstamo disponibles
 */
export async function getLoanTypes(
  categoryId: number,
  pledgeId: number,
  price: number,
  params?: VehiclesPriceParams,
  location?: {
    user_id?: string;
    state?: string;
    delegation?: string;
    colony?: string;
    cp?: string;
    category?: string;
    category_id?: string;
  }
): Promise<any> {
  const { apiUrl, apiKey } = getCatalogApiConfig();

  try {
    const requestBody: any = {
      data: {
        category_id: categoryId,
        pledge_id: pledgeId,
        price,
      },
    };

    // Para vehículos, agregar params y location
    if (params && (categoryId === 2 || categoryId === 6)) {
      requestBody.data.params = params;
      if (location) {
        requestBody.location = location;
      }
    }

    const response = await fetch(`${apiUrl}/simulator/type-loan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API de líneas de préstamo error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error obteniendo líneas de préstamo:", error);
    throw error;
  }
}

