/**
 * Servicio para guardar y leer cotizaciones usando Shopify Metaobjects
 * Los Metaobjetos son entidades independientes (no asociadas al Shop)
 */

import type { AdminApiContext } from "@shopify/shopify-app-react-router/server";
import type { Quote, QuoteStatus } from "../types/quote.types";

const METAOBJECT_TYPE = "cotizacion";

/**
 * Convierte un Quote a campos de Metaobject
 */
function quoteToMetaobjectFields(quote: Quote) {
  return [
    { key: "quote_number", value: quote.quoteNumber },
    { key: "created_at", value: quote.createdAt },
    { key: "update_at", value: quote.updatedAt },
    { key: "customer_name", value: quote.customerName },
    { key: "customer_email", value: quote.customerEmail },
    { key: "customer_phone", value: quote.customerPhone || "" },
    { key: "status", value: quote.status },
    { key: "items", value: JSON.stringify(quote.items) },
    { key: "subtotal", value: quote.subtotal.toString() },
    { key: "tax", value: quote.tax.toString() },
    { key: "discount", value: quote.discount.toString() },
    { key: "total", value: quote.total.toString() },
    { key: "notes", value: quote.notes || "" },
    { key: "loan_info", value: "" }, // Por ahora vacío, se puede extraer de notes
    { key: "origin", value: quote.notes?.includes('storefront') ? 'storefront' : 'admin' },
    { key: "valid_until", value: new Date(quote.validUntil).toISOString().split('T')[0] }, // YYYY-MM-DD
    // Campos de sucursal y cita
    { key: "branch_id", value: quote.branchId || "" },
    { key: "appointment_date", value: quote.appointmentDate || "" },
    { key: "appointment_time", value: quote.appointmentTime || "" },
  ];
}

/**
 * Convierte campos de Metaobject a Quote
 */
function metaobjectToQuote(metaobject: any): Quote {
  const fieldsMap: Record<string, string> = {};
  metaobject.fields?.forEach((field: any) => {
    fieldsMap[field.key] = field.value;
  });

  return {
    id: metaobject.id,
    quoteNumber: fieldsMap.quote_number || "",
    shopId: "", // No se almacena en metaobjeto
    status: (fieldsMap.status || "draft") as QuoteStatus,
    customerName: fieldsMap.customer_name || "",
    customerEmail: fieldsMap.customer_email || "",
    customerPhone: fieldsMap.customer_phone || undefined,
    branchName: "Sucursal Principal", // Se puede agregar campo si es necesario
    branchEmail: fieldsMap.customer_email || "",
    items: JSON.parse(fieldsMap.items || "[]"),
    subtotal: parseFloat(fieldsMap.subtotal || "0"),
    tax: parseFloat(fieldsMap.tax || "0"),
    discount: parseFloat(fieldsMap.discount || "0"),
    total: parseFloat(fieldsMap.total || "0"),
    notes: fieldsMap.notes || undefined,
    validUntil: fieldsMap.valid_until || new Date().toISOString(),
    createdAt: fieldsMap.created_at || new Date().toISOString(),
    updatedAt: fieldsMap.update_at || fieldsMap.updated_at || fieldsMap.created_at || new Date().toISOString(),
    // Campos de sucursal y cita
    branchId: fieldsMap.branch_id || undefined,
    appointmentDate: fieldsMap.appointment_date || undefined,
    appointmentTime: fieldsMap.appointment_time || undefined,
  };
}

/**
 * Guarda una cotización como Metaobject
 */
export async function saveQuote(
  admin: AdminApiContext,
  shopId: string,
  quoteData: Omit<Quote, "id" | "quoteNumber" | "shopId" | "createdAt" | "updatedAt">
): Promise<Quote> {
  // Generar número incremental
  let quoteNumber: string;
  try {
    const existingQuotes = await getQuotes(admin, shopId);
    
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
    
    const nextNumber = maxNumber + 1;
    quoteNumber = `COT-${nextNumber}`;
    console.log(`🔢 [Metaobjects] Número generado: ${quoteNumber} (anterior: ${maxNumber})`);
  } catch (error) {
    console.error("Error generando número incremental, usando fallback:", error);
    quoteNumber = `COT-${Date.now()}`;
  }

  const now = new Date().toISOString();

  const quote: Quote = {
    ...quoteData,
    id: "",
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

  try {
    console.log("💾 [Metaobjects] Guardando metaobjeto...");
    console.log("💾 [Metaobjects] Tipo:", METAOBJECT_TYPE);
    console.log("💾 [Metaobjects] Handle:", quoteNumber.toLowerCase());

    const fields = quoteToMetaobjectFields(quote);

    const response = await admin.graphql(
      `#graphql
        mutation metaobjectCreate($metaobject: MetaobjectCreateInput!) {
          metaobjectCreate(metaobject: $metaobject) {
            metaobject {
              id
              handle
              fields {
                key
                value
              }
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
          metaobject: {
            type: METAOBJECT_TYPE,
            handle: quoteNumber.toLowerCase(),
            fields: fields,
          },
        },
      }
    );

    const result = await response.json();
    console.log("📥 [Metaobjects] Respuesta:", JSON.stringify(result, null, 2));

    if (result.data?.metaobjectCreate?.userErrors?.length > 0) {
      const errors = result.data.metaobjectCreate.userErrors
        .map((e: { message: string }) => e.message)
        .join(", ");
      console.error("❌ [Metaobjects] Errores de Shopify:", errors);
      throw new Error(errors);
    }

    const metaobjectId = result.data?.metaobjectCreate?.metaobject?.id;
    if (metaobjectId) {
      quote.id = metaobjectId;
      console.log("✅ [Metaobjects] Metaobjeto guardado con ID:", metaobjectId);
    } else {
      console.warn("⚠️ [Metaobjects] No se recibió ID del metaobjeto guardado");
    }

    return quote;
  } catch (error) {
    console.error("❌ [Metaobjects] Error guardando cotización:", error);
    console.error("❌ [Metaobjects] Error type:", error instanceof Error ? error.constructor.name : typeof error);
    console.error("❌ [Metaobjects] Error message:", error instanceof Error ? error.message : String(error));
    console.error("❌ [Metaobjects] Error stack:", error instanceof Error ? error.stack : "No stack available");
    throw error;
  }
}

/**
 * Obtiene todas las cotizaciones desde Metaobjects
 */
export async function getQuotes(
  admin: AdminApiContext,
  shopId: string
): Promise<Quote[]> {
  try {
    console.log("📋 [Metaobjects] Obteniendo cotizaciones...");

    const response = await admin.graphql(
      `#graphql
        query getMetaobjects($type: String!, $first: Int!) {
          metaobjects(type: $type, first: $first) {
            edges {
              node {
                id
                handle
                fields {
                  key
                  value
                }
              }
            }
          }
        }
      `,
      {
        variables: {
          type: METAOBJECT_TYPE,
          first: 250,
        },
      }
    );

    const result = await response.json();
    const metaobjects = result.data?.metaobjects?.edges || [];

    console.log(`📋 [Metaobjects] ${metaobjects.length} metaobjetos encontrados`);

    const quotes: Quote[] = metaobjects
      .map((edge: { node: any }) => {
        try {
          return metaobjectToQuote(edge.node);
        } catch (error) {
          console.error(`Error parseando metaobjeto ${edge.node.handle}:`, error);
          return null;
        }
      })
      .filter((quote: Quote | null) => quote !== null);

    return quotes.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    console.error("❌ [Metaobjects] Error obteniendo cotizaciones:", error);
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
    console.log("🔍 [Metaobjects] Buscando cotización:", quoteId);

    const response = await admin.graphql(
      `#graphql
        query getMetaobject($id: ID!) {
          metaobject(id: $id) {
            id
            handle
            fields {
              key
              value
            }
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
    const metaobject = result.data?.metaobject;

    if (!metaobject) {
      console.warn("⚠️ [Metaobjects] Cotización no encontrada");
      return null;
    }

    return metaobjectToQuote(metaobject);
  } catch (error) {
    console.error("❌ [Metaobjects] Error obteniendo cotización:", error);
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

  try {
    console.log("🔄 [Metaobjects] Actualizando estado a:", status);

    const response = await admin.graphql(
      `#graphql
        mutation metaobjectUpdate($id: ID!, $metaobject: MetaobjectUpdateInput!) {
          metaobjectUpdate(id: $id, metaobject: $metaobject) {
            metaobject {
              id
              handle
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
          id: quoteId,
          metaobject: {
            fields: quoteToMetaobjectFields(quote),
          },
        },
      }
    );

    const result = await response.json();

    if (result.data?.metaobjectUpdate?.userErrors?.length > 0) {
      const errors = result.data.metaobjectUpdate.userErrors
        .map((e: { message: string }) => e.message)
        .join(", ");
      throw new Error(errors);
    }

    console.log("✅ [Metaobjects] Estado actualizado exitosamente");
    return quote;
  } catch (error) {
    console.error("❌ [Metaobjects] Error actualizando estado:", error);
    throw error;
  }
}