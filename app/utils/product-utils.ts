/**
 * Utilidades para productos (compartidas entre cliente y servidor)
 */

import type { ExternalProduct, QuoteItem } from "../types/quote.types";

/**
 * Convierte un producto externo a QuoteItem
 */
export function externalProductToQuoteItem(
  product: ExternalProduct,
  quantity: number = 1
): QuoteItem {
  return {
    externalProductId: product.id,
    productCode: product.code,
    productName: product.name,
    description: product.description,
    quantity,
    unitPrice: product.price,
    totalPrice: product.price * quantity,
  };
}

