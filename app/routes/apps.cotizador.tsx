/**
 * App Proxy endpoint para recibir solicitudes de cotización desde el storefront
 * URL: /apps/cotizador
 */

import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { saveQuote } from "../services/metaobjects.server";

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
  console.log("📥 [App Proxy] GET request recibido en /apps/cotizador");
  
  // Autenticar la petición del proxy (opcional para GET público, pero buena práctica)
  try {
    await authenticate.public.appProxy(request);
  } catch (error) {
    console.log("⚠️ [App Proxy] GET sin firma válida (posible acceso directo)");
  }

  return jsonResponse({
    message: "Cotizador App Proxy endpoint funcionando",
    timestamp: new Date().toISOString(),
    method: "GET"
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  console.log(`📥 [App Proxy] ${request.method} request recibido`);

  // Manejar OPTIONS para CORS preflight si fuera necesario
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Método no permitido" }, 405);
  }

  try {
    // 1. Autenticar la petición del App Proxy
    console.log("🔐 [App Proxy] Autenticando...");
    const { session, admin } = await authenticate.public.appProxy(request);
    
    if (!session || !admin) {
      console.error("❌ [App Proxy] Falló la autenticación del proxy");
      return jsonResponse({ error: "No autorizado" }, 401);
    }

    console.log("✅ [App Proxy] Autenticado. Shop:", session.shop);
    const shopId = session.shop;

    // 2. Obtener datos del formulario
    const formData = await request.formData();
    
    const customerName = formData.get("customerName") as string;
    const customerEmail = formData.get("customerEmail") as string;
    const customerPhone = formData.get("customerPhone") as string;
    const message = formData.get("message") as string;
    const source = formData.get("source") as string || "storefront";
    const selectedProductsJson = formData.get("selectedProducts") as string;
    const selectedLoanJson = formData.get("selectedLoan") as string;

    console.log("📋 [App Proxy] Datos recibidos:", {
      customerName,
      customerEmail,
      customerPhone,
      message: message?.substring(0, 50),
      source,
      products: selectedProductsJson ? "Sí" : "No",
      loan: selectedLoanJson ? "Sí" : "No"
    });

    // 3. Validaciones
    if (!customerName || !customerEmail) {
      return jsonResponse({ error: "Nombre y email son requeridos" }, 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      return jsonResponse({ error: "Email no válido" }, 400);
    }

    // 4. Procesar productos
    let items: any[] = [];
    let subtotal = 0;
    let loanInfo = "";
    
    if (selectedProductsJson) {
      try {
        const selectedProducts = JSON.parse(selectedProductsJson);
        console.log("📦 [App Proxy] Productos seleccionados:", selectedProducts.length);
        
        items = selectedProducts.map((product: any) => ({
          externalProductId: product.path?.[product.path.length - 1]?.id || "",
          productCode: product.path?.[product.path.length - 1]?.name || "",
          productName: product.name,
          description: product.path?.map((p: any) => p.name).join(" > ") || "",
          quantity: 1,
          unitPrice: product.price,
          totalPrice: product.price,
        }));
        
        subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
      } catch (error) {
        console.error("❌ [App Proxy] Error parseando productos:", error);
      }
    }

    // 5. Procesar préstamo
    if (selectedLoanJson) {
      try {
        const selectedLoan = JSON.parse(selectedLoanJson);
        console.log("💳 [App Proxy] Préstamo:", selectedLoan.term?.formatted_payment);
        
        loanInfo = `\n\nOpción de Préstamo Seleccionada:\n` +
                   `- Producto: ${selectedLoan.product}\n` +
                   `- Frecuencia: ${selectedLoan.frequency}\n` +
                   `- Término: ${selectedLoan.term.formatted_term}\n` +
                   `- Pago: ${selectedLoan.term.formatted_payment}\n` +
                   `- Último pago: ${selectedLoan.term.formatted_last_payment}`;
        
        if (selectedLoan.term.formatted_payment_pref) {
          loanInfo += `\n- Pago preferente: ${selectedLoan.term.formatted_payment_pref}\n` +
                     `- Último pago preferente: ${selectedLoan.term.formatted_last_payment_pref}`;
        }
      } catch (error) {
        console.error("❌ [App Proxy] Error parseando opción de préstamo:", error);
      }
    }

    // 6. Guardar cotización (usando el contexto 'admin' del proxy)
    console.log("💾 [App Proxy] Guardando cotización...");
    
    // IMPORTANTE: authenticate.public.appProxy devuelve un 'admin' context limitado
    // pero suficiente para operaciones básicas si los scopes están bien.
    // Si falla, habría que usar un cliente offline, pero probemos así primero.
    
    const quote = await saveQuote(admin, shopId, {
      customerName,
      customerEmail,
      customerPhone: customerPhone || undefined,
      branchName: "Storefront Request",
      branchEmail: customerEmail,
      items,
      status: "draft",
      subtotal,
      tax: 0,
      discount: 0,
      total: subtotal,
      notes: (message ? `Solicitud desde storefront:\n${message}` : "") +
             (items.length > 0 ? `\n\nCotización con ${items.length} producto(s) seleccionado(s) desde catálogo` : "Solicitud de cotización desde el storefront") +
             loanInfo,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });

    console.log(`✅ [App Proxy] Cotización creada: ${quote.quoteNumber}`);

    return jsonResponse({
      success: true,
      message: "Solicitud recibida exitosamente.",
      quoteId: quote.id,
      quoteNumber: quote.quoteNumber,
    });

  } catch (error) {
    console.error("❌ [App Proxy] Error fatal:", error);
    return jsonResponse({
      error: "Error interno del servidor",
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
};
