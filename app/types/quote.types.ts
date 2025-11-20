/**
 * Tipos TypeScript para el sistema de cotizaciones
 */

export interface QuoteItem {
  externalProductId: string; // ID del producto en la API externa
  productCode: string;
  productName: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number; // quantity * unitPrice
  notes?: string;
}

export type QuoteStatus = 
  | "draft"      // Borrador
  | "sent"       // Enviada
  | "approved"   // Aprobada
  | "rejected"   // Rechazada
  | "expired";   // Expirada

export interface Quote {
  id?: string; // ID del Metafield/Metaobject en Shopify
  quoteNumber: string; // "COT-2024-001"
  shopId: string; // ID de la tienda Shopify
  status: QuoteStatus;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  branchName: string;
  branchEmail: string;
  items: QuoteItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  notes?: string;
  validUntil: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Datos para crear una nueva cotización
 */
export interface CreateQuoteInput {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  branchName: string;
  branchEmail: string;
  items: QuoteItem[];
  tax?: number;
  discount?: number;
  notes?: string;
  validUntilDays?: number; // Días de validez (default: 30)
}

/**
 * Producto de la API externa
 */
export interface ExternalProduct {
  id: string;
  code: string;
  name: string;
  description?: string;
  price: number;
  // Agregar más campos según la estructura real de la API
  [key: string]: unknown;
}

