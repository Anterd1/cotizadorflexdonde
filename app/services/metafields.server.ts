/**
 * Servicio para guardar y leer cotizaciones usando Shopify Metafields
 */

import type { AdminApiContext } from "@shopify/shopify-app-react-router/server";
import type { Quote, QuoteStatus } from "../types/quote.types";

const METAFIELD_NAMESPACE = "cotizador";
const METAFIELD_KEY_PREFIX = "quote";

/**
 * Guarda una cotización en Shopify Metafields
 */
export async function saveQuote(
  admin: AdminApiContext,
  shopId: string,
  quoteData: Omit<Quote, "id" | "quoteNumber" | "shopId" | "createdAt" | "updatedAt">
): Promise<Quote> {
  // Obtener cotizaciones existentes para generar número incremental
  let quoteNumber: string;
  try {
    const existingQuotes = await getQuotes(admin, shopId);
    
    // Extraer el número más alto
    let maxNumber = 0;
    existingQuotes.forEach(quote => {
      const match = quote.quoteNumber.match(/^COT-(\d+)$/);
      if (match) {
        const num = parseInt(match[1]);
        if (num > maxNumber) {
          maxNumber = num;
        }
      }
    });
    
    // Incrementar en 1
    const nextNumber = maxNumber + 1;
    quoteNumber = `COT-${nextNumber}`;
    console.log(`🔢 [Metafields] Número de cotización generado: ${quoteNumber} (anterior: ${maxNumber})`);
  } catch (error) {
    // Si hay error, usar fallback con timestamp
    console.error("Error generando número incremental, usando fallback:", error);
    quoteNumber = `COT-${Date.now()}`;
  }
  
  const now = new Date().toISOString();

  const quote: Quote = {
    ...quoteData,
    id: "", // Se asignará después de guardar
    quoteNumber,
    shopId,
    createdAt: now,
    updatedAt: now,
  };

  // Calcular totales si no están calculados
  if (!quote.subtotal) {
    quote.subtotal = quote.items.reduce((sum, item) => sum + item.totalPrice, 0);
  }
  if (!quote.total) {
    quote.total = quote.subtotal + (quote.tax || 0) - (quote.discount || 0);
  }

  // Guardar como Metafield directamente
  try {
    console.log("🔍 [Metafields] Obteniendo shop GID...");
    // Primero necesitamos obtener el shop GID correcto
    const shopInfoResponse = await admin.graphql(
      `#graphql
        query {
          shop {
            id
          }
        }
      `
    );

    const shopInfo = await shopInfoResponse.json();
    const shopGid = shopInfo.data?.shop?.id;
    console.log("✅ [Metafields] Shop GID obtenido:", shopGid);

    if (!shopGid) {
      console.error("❌ [Metafields] No se pudo obtener el shop GID");
      throw new Error("No se pudo obtener el ID de la tienda");
    }

    // Guardar como Metafield
    console.log("💾 [Metafields] Guardando metafield...");
    console.log("💾 [Metafields] Namespace:", METAFIELD_NAMESPACE);
    console.log("💾 [Metafields] Key:", `${METAFIELD_KEY_PREFIX}_${quoteNumber}`);
    const metafieldResponse = await admin.graphql(
      `#graphql
        mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
          metafieldsSet(metafields: $metafields) {
            metafields {
              id
              namespace
              key
            }
            userErrors {
              field
              message
            }
          }
        }
      `,
      {
        variables: {
          metafields: [
            {
              namespace: METAFIELD_NAMESPACE,
              key: `${METAFIELD_KEY_PREFIX}_${quoteNumber}`,
              ownerId: shopGid,
              value: JSON.stringify(quote),
              type: "json",
            },
          ],
        },
      }
    );

    const metafieldResult = await metafieldResponse.json();
    console.log("📥 [Metafields] Respuesta de metafieldsSet:", JSON.stringify(metafieldResult, null, 2));

    if (metafieldResult.data?.metafieldsSet?.userErrors?.length > 0) {
      const errors = metafieldResult.data.metafieldsSet.userErrors
        .map((e: { message: string }) => e.message)
        .join(", ");
      console.error("❌ [Metafields] Errores de Shopify:", errors);
      throw new Error(errors);
    }

    const metafieldId = metafieldResult.data?.metafieldsSet?.metafields?.[0]?.id;
    if (metafieldId) {
      quote.id = metafieldId;
      console.log("✅ [Metafields] Metafield guardado con ID:", metafieldId);
    } else {
      console.warn("⚠️ [Metafields] No se recibió ID del metafield guardado");
    }

    return quote;
  } catch (error) {
    console.error("❌ [Metafields] Error guardando cotización:", error);
    console.error("❌ [Metafields] Error type:", error instanceof Error ? error.constructor.name : typeof error);
    console.error("❌ [Metafields] Error message:", error instanceof Error ? error.message : String(error));
    console.error("❌ [Metafields] Error stack:", error instanceof Error ? error.stack : "No stack available");
    throw error;
  }
}

/**
 * Obtiene todas las cotizaciones de una tienda
 */
export async function getQuotes(
  admin: AdminApiContext,
  shopId: string
): Promise<Quote[]> {
  try {
    // Obtener el shop GID
    const shopInfoResponse = await admin.graphql(
      `#graphql
        query {
          shop {
            id
          }
        }
      `
    );

    const shopInfo = await shopInfoResponse.json();
    const shopGid = shopInfo.data?.shop?.id;

    if (!shopGid) {
      throw new Error("No se pudo obtener el ID de la tienda");
    }

    const response = await admin.graphql(
      `#graphql
        query getShopMetafields($namespace: String!) {
          shop {
            metafields(first: 250, namespace: $namespace) {
              edges {
                node {
                  id
                  key
                  value
                  updatedAt
                }
              }
            }
          }
        }
      `,
      {
        variables: {
          namespace: METAFIELD_NAMESPACE,
        },
      }
    );

    const result = await response.json();
    const metafields = result.data?.shop?.metafields?.edges || [];

    const quotes: Quote[] = metafields
      .map((edge: { node: { id: string; key: string; value: string } }) => {
        try {
          const quote: Quote = JSON.parse(edge.node.value);
          quote.id = edge.node.id;
          return quote;
        } catch (error) {
          console.error(`Error parseando cotización ${edge.node.key}:`, error);
          return null;
        }
      })
      .filter((quote: Quote | null) => quote !== null);

    // Ordenar por fecha de creación (más recientes primero)
    return quotes.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    console.error("Error obteniendo cotizaciones:", error);
    throw error;
  }
}

/**
 * Obtiene una cotización específica por ID
 */
export async function getQuoteById(
  admin: AdminApiContext,
  shopId: string,
  quoteId: string
): Promise<Quote | null> {
  try {
    const response = await admin.graphql(
      `#graphql
        query getMetafield($id: ID!) {
          metafield(id: $id) {
            id
            key
            value
            updatedAt
          }
        }
      `,
      {
        variables: {
          id: quoteId,
        },
      }
    );

    const result = await response.json();
    const metafield = result.data?.metafield;

    if (!metafield) {
      return null;
    }

    const quote: Quote = JSON.parse(metafield.value);
    quote.id = metafield.id;
    return quote;
  } catch (error) {
    console.error("Error obteniendo cotización:", error);
    return null;
  }
}

/**
 * Actualiza el estado de una cotización
 */
export async function updateQuoteStatus(
  admin: AdminApiContext,
  shopId: string,
  quoteId: string,
  status: QuoteStatus
): Promise<Quote> {
  const quote = await getQuoteById(admin, shopId, quoteId);
  if (!quote) {
    throw new Error("Cotización no encontrada");
  }

  quote.status = status;
  quote.updatedAt = new Date().toISOString();

  // Actualizar el Metafield
  const response = await admin.graphql(
    `#graphql
      mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields {
            id
          }
          userErrors {
            field
            message
          }
        }
      }
    `,
    {
      variables: {
        metafields: [
          {
            id: quoteId,
            value: JSON.stringify(quote),
            type: "json",
          },
        ],
      },
    }
  );

  const result = await response.json();

  if (result.data?.metafieldsSet?.userErrors?.length > 0) {
    throw new Error(
      result.data.metafieldsSet.userErrors
        .map((e: { message: string }) => e.message)
        .join(", ")
    );
  }

  return quote;
}

