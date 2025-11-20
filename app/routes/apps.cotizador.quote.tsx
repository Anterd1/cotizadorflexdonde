/**
 * App Proxy endpoint para recibir solicitudes de cotización desde el storefront
 * URL: /apps/cotizador/quote
 */

import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { saveQuote } from "../services/metaobjects.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  // Validar que es una petición POST
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método no permitido" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Para App Proxy, necesitamos autenticar de manera diferente
    // El shop viene en el formData o en los headers
    console.log("📥 [App Proxy] Petición recibida");
    const formData = await request.formData();
    const shop = formData.get("shop") as string;
    
    console.log("🔍 [App Proxy] Shop recibido:", shop);
    console.log("🔍 [App Proxy] Headers:", Object.fromEntries(request.headers.entries()));

    if (!shop) {
      console.error("❌ [App Proxy] Shop no válido");
      return new Response(JSON.stringify({ error: "Shop no válido" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Intentar autenticar con el request
    // Si el App Proxy está configurado correctamente, Shopify añadirá headers especiales
    let admin;
    let session;

    try {
      console.log("🔐 [App Proxy] Intentando autenticar...");
      // Intentar autenticar como admin (para App Proxy)
      const authResult = await authenticate.admin(request);
      admin = authResult.admin;
      session = authResult.session;
      console.log("✅ [App Proxy] Autenticación exitosa");
      console.log("✅ [App Proxy] Session shop:", session?.shop);
    } catch (error) {
      // Si falla la autenticación admin, intentar con webhook/unauthenticated
      // Para App Proxy, necesitamos validar la firma HMAC de Shopify
      console.error("❌ [App Proxy] Error autenticando:", error);
      console.error("❌ [App Proxy] Error details:", error instanceof Error ? error.message : String(error));
      console.error("❌ [App Proxy] Stack:", error instanceof Error ? error.stack : "No stack");
      
      // Por ahora, crear una cotización básica sin autenticación completa
      // En producción, deberías validar el HMAC signature de Shopify
      return new Response(
        JSON.stringify({
          error: "Error de autenticación. Por favor configura el App Proxy correctamente.",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Obtener datos del formulario
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
      selectedProducts: selectedProductsJson?.substring(0, 100),
      selectedLoan: selectedLoanJson?.substring(0, 100),
    });

    // Validar campos requeridos
    if (!customerName || !customerEmail) {
      console.error("❌ [App Proxy] Campos requeridos faltantes");
      return new Response(
        JSON.stringify({ error: "Nombre y email son requeridos" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      console.error("❌ [App Proxy] Email no válido:", customerEmail);
      return new Response(JSON.stringify({ error: "Email no válido" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Obtener el shop ID desde la sesión o del shop domain
    const shopId = session?.shop || shop.replace(".myshopify.com", "");
    console.log("🏪 [App Proxy] Shop ID:", shopId);

    // Procesar productos seleccionados desde catálogos
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
        console.log("💰 [App Proxy] Subtotal calculado:", subtotal);
      } catch (error) {
        console.error("❌ [App Proxy] Error parseando productos:", error);
      }
    }

    // Procesar información de préstamo seleccionado
    if (selectedLoanJson) {
      try {
        const selectedLoan = JSON.parse(selectedLoanJson);
        console.log("💳 [App Proxy] Opción de préstamo seleccionada:", selectedLoan);
        
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

    // Crear cotización desde el storefront
    console.log("💾 [App Proxy] Intentando guardar cotización...");
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

    // Log para debugging (remover en producción o usar un logger apropiado)
    console.log(`✅ [App Proxy] Cotización creada exitosamente: ${quote.quoteNumber} para ${customerEmail}`);
    console.log(`✅ [App Proxy] Quote ID: ${quote.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Solicitud recibida. Te contactaremos pronto.",
        quoteId: quote.id,
        quoteNumber: quote.quoteNumber,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ [App Proxy] Error creando cotización desde storefront:", error);
    console.error("❌ [App Proxy] Error type:", error instanceof Error ? error.constructor.name : typeof error);
    console.error("❌ [App Proxy] Error message:", error instanceof Error ? error.message : String(error));
    console.error("❌ [App Proxy] Error stack:", error instanceof Error ? error.stack : "No stack available");

    // No exponer detalles del error al cliente por seguridad
    return new Response(
      JSON.stringify({
        error: "Error al procesar la solicitud. Por favor intenta de nuevo más tarde.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

// También permitir GET para verificar que el endpoint funciona
export const loader = async ({ request }: ActionFunctionArgs) => {
  return new Response(
    JSON.stringify({
      message: "Cotizador App Proxy endpoint",
      method: "Use POST to submit a quote request",
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
};

