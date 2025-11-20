import { useEffect } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useFetcher, useLoaderData, useRouteError } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { getQuoteById, updateQuoteStatus } from "../services/metaobjects.server";
import { sendQuoteEmails } from "../services/outlook.server";
import { boundary } from "@shopify/shopify-app-react-router/server";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const shopId = session.shop;
  const quoteId = params.id;

  if (!quoteId) {
    throw new Response("Cotización no encontrada", { status: 404 });
  }

  const quote = await getQuoteById(admin, shopId, quoteId);

  if (!quote) {
    throw new Response("Cotización no encontrada", { status: 404 });
  }

  return { quote };
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const shopId = session.shop;
  const quoteId = params.id;

  if (!quoteId) {
    return { error: "ID de cotización no válido" };
  }

  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "send") {
    try {
      const quote = await getQuoteById(admin, shopId, quoteId);
      if (!quote) {
        return { error: "Cotización no encontrada" };
      }

      // Enviar emails
      await sendQuoteEmails(quote);

      // Actualizar estado a "sent"
      await updateQuoteStatus(admin, shopId, quoteId, "sent");

      return { success: true, message: "Cotización enviada exitosamente" };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Error enviando cotización",
      };
    }
  }

  return { error: "Acción no válida" };
};

export default function QuoteDetail() {
  const { quote } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const shopify = useAppBridge();

  useEffect(() => {
    if (fetcher.data?.success) {
      shopify.toast.show(fetcher.data.message || "Cotización enviada");
    }
    if (fetcher.data?.error) {
      shopify.toast.show(fetcher.data.error, { isError: true });
    }
  }, [fetcher.data, shopify]);

  const handleSend = () => {
    if (confirm("¿Estás seguro de enviar esta cotización? Se enviarán emails a la sucursal y al cliente.")) {
      fetcher.submit({ intent: "send" }, { method: "POST" });
    }
  };

  const getOrigin = () => {
    if (quote.notes?.includes('storefront') || quote.notes?.includes('Storefront')) {
      return { type: 'storefront', label: 'Storefront', icon: '🌐' };
    }
    return { type: 'admin', label: 'App Embebida', icon: '🖥️' };
  };

  const parseLoanInfo = () => {
    if (!quote.notes) return null;
    
    const loanMatch = quote.notes.match(/Opción de Préstamo Seleccionada:([\s\S]*?)(?=\n\n|$)/);
    if (!loanMatch) return null;
    
    const loanText = loanMatch[1];
    const producto = loanText.match(/- Producto: (.+)/)?.[1];
    const frecuencia = loanText.match(/- Frecuencia: (.+)/)?.[1];
    const termino = loanText.match(/- Término: (.+)/)?.[1];
    const pago = loanText.match(/- Pago: (.+)/)?.[1];
    const ultimoPago = loanText.match(/- Último pago: (.+)/)?.[1];
    const pagoPreferente = loanText.match(/- Pago preferente: (.+)/)?.[1];
    
    return { producto, frecuencia, termino, pago, ultimoPago, pagoPreferente };
  };

  const origin = getOrigin();
  const loanInfo = parseLoanInfo();

  return (
    <s-page heading={`Cotización #${quote.quoteNumber}`}>
      <s-section>
        <s-stack direction="inline" gap="base">
          {quote.status === "draft" && (
            <s-button variant="primary" onClick={handleSend}>
              Enviar Cotización
            </s-button>
          )}
          <s-button variant="tertiary">
            <a href="/app/quotes" style={{ textDecoration: "none", color: "inherit" }}>
              Volver a Lista
            </a>
          </s-button>
        </s-stack>
      </s-section>

      <s-section heading="Información General">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1rem" }}>
          <s-box padding="base" background="subdued">
            <div style={{ marginBottom: "0.5rem", fontSize: "0.85rem", color: "#666" }}>Número de Cotización</div>
            <div style={{ fontSize: "1.5rem", fontWeight: "700", color: "#1976d2" }}>{quote.quoteNumber}</div>
          </s-box>
          
          <s-box padding="base" background="subdued">
            <div style={{ marginBottom: "0.5rem", fontSize: "0.85rem", color: "#666" }}>Estado</div>
            <span
              style={{
                padding: "6px 12px",
                borderRadius: "16px",
                fontSize: "0.9rem",
                fontWeight: "600",
                backgroundColor:
                  quote.status === "sent" ? "#e3f2fd" :
                  quote.status === "approved" ? "#e8f5e9" :
                  quote.status === "rejected" ? "#ffebee" : "#fff3cd",
                color:
                  quote.status === "sent" ? "#1976d2" :
                  quote.status === "approved" ? "#388e3c" :
                  quote.status === "rejected" ? "#d32f2f" : "#856404",
              }}
            >
              {quote.status === 'draft' ? '📝 Borrador' : 
               quote.status === 'sent' ? '📧 Enviada' :
               quote.status === 'approved' ? '✅ Aprobada' :
               quote.status === 'rejected' ? '❌ Rechazada' : quote.status}
            </span>
          </s-box>

          <s-box padding="base" background="subdued">
            <div style={{ marginBottom: "0.5rem", fontSize: "0.85rem", color: "#666" }}>Origen</div>
            <div style={{ fontSize: "1.2rem" }}>
              <span style={{ marginRight: "0.5rem" }}>{origin.icon}</span>
              <span style={{ fontWeight: "600" }}>{origin.label}</span>
            </div>
          </s-box>

          <s-box padding="base" background="subdued">
            <div style={{ marginBottom: "0.5rem", fontSize: "0.85rem", color: "#666" }}>Fecha de Creación</div>
            <div style={{ fontWeight: "600" }}>
              {new Date(quote.createdAt).toLocaleDateString('es-ES', { 
                day: '2-digit', 
                month: 'long', 
                year: 'numeric' 
              })}
            </div>
            <div style={{ fontSize: "0.85rem", color: "#666", marginTop: "0.25rem" }}>
              {new Date(quote.createdAt).toLocaleTimeString('es-ES', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          </s-box>

          <s-box padding="base" background="subdued">
            <div style={{ marginBottom: "0.5rem", fontSize: "0.85rem", color: "#666" }}>Válida Hasta</div>
            <div style={{ fontWeight: "600" }}>
              {new Date(quote.validUntil).toLocaleDateString('es-ES', { 
                day: '2-digit', 
                month: 'long', 
                year: 'numeric' 
              })}
            </div>
          </s-box>

          <s-box padding="base" background="subdued">
            <div style={{ marginBottom: "0.5rem", fontSize: "0.85rem", color: "#666" }}>Valor Total</div>
            <div style={{ 
              fontSize: "1.8rem", 
              fontWeight: "700", 
              color: quote.total > 0 ? "#27ae60" : "#999" 
            }}>
              ${quote.total.toFixed(2)}
            </div>
          </s-box>
        </div>
      </s-section>

      <s-section heading="Cliente">
        <s-box padding="base" background="subdued">
          <s-stack direction="block" gap="base">
            <div>
              <strong>Nombre:</strong> {quote.customerName}
            </div>
            <div>
              <strong>Email:</strong> {quote.customerEmail}
            </div>
            {quote.customerPhone && (
              <div>
                <strong>Teléfono:</strong> {quote.customerPhone}
              </div>
            )}
          </s-stack>
        </s-box>
      </s-section>

      <s-section heading="Sucursal">
        <s-box padding="base" background="subdued">
          <s-stack direction="block" gap="base">
            <div>
              <strong>Nombre:</strong> {quote.branchName}
            </div>
            <div>
              <strong>Email:</strong> {quote.branchEmail}
            </div>
          </s-stack>
        </s-box>
      </s-section>

      {loanInfo && (
        <s-section heading="Opción de Préstamo Seleccionada">
          <s-box padding="base">
            <div style={{ 
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              padding: "1.5rem",
              borderRadius: "12px",
              color: "white"
            }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
                {loanInfo.producto && (
                  <div>
                    <div style={{ fontSize: "0.85rem", opacity: 0.9, marginBottom: "0.25rem" }}>Tipo de Plan</div>
                    <div style={{ fontSize: "1.2rem", fontWeight: "700" }}>{loanInfo.producto}</div>
                  </div>
                )}
                {loanInfo.frecuencia && (
                  <div>
                    <div style={{ fontSize: "0.85rem", opacity: 0.9, marginBottom: "0.25rem" }}>Frecuencia</div>
                    <div style={{ fontSize: "1.2rem", fontWeight: "700" }}>{loanInfo.frecuencia}</div>
                  </div>
                )}
                {loanInfo.termino && (
                  <div>
                    <div style={{ fontSize: "0.85rem", opacity: 0.9, marginBottom: "0.25rem" }}>Término</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: "600" }}>{loanInfo.termino}</div>
                  </div>
                )}
              </div>
              
              {(loanInfo.pago || loanInfo.ultimoPago) && (
                <div style={{ 
                  marginTop: "1rem", 
                  paddingTop: "1rem", 
                  borderTop: "1px solid rgba(255,255,255,0.3)",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "1rem"
                }}>
                  {loanInfo.pago && (
                    <div>
                      <div style={{ fontSize: "0.85rem", opacity: 0.9, marginBottom: "0.25rem" }}>Cada Refrendo</div>
                      <div style={{ fontSize: "1.5rem", fontWeight: "700" }}>{loanInfo.pago}</div>
                    </div>
                  )}
                  {loanInfo.ultimoPago && (
                    <div>
                      <div style={{ fontSize: "0.85rem", opacity: 0.9, marginBottom: "0.25rem" }}>Último Pago</div>
                      <div style={{ fontSize: "1.5rem", fontWeight: "700" }}>{loanInfo.ultimoPago}</div>
                    </div>
                  )}
                  {loanInfo.pagoPreferente && (
                    <div>
                      <div style={{ fontSize: "0.85rem", opacity: 0.9, marginBottom: "0.25rem" }}>Pago Preferente</div>
                      <div style={{ fontSize: "1.3rem", fontWeight: "700" }}>{loanInfo.pagoPreferente}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </s-box>
        </s-section>
      )}

      <s-section heading={`Artículos (${quote.items.length})`}>
        {quote.items.length === 0 ? (
          <s-box padding="base" background="subdued">
            <div style={{ textAlign: "center", padding: "2rem", color: "#999" }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📦</div>
              <div>Sin productos agregados</div>
            </div>
          </s-box>
        ) : (
          <s-box padding="base">
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #ddd", background: "#f8f9fa" }}>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Código</th>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Producto</th>
                    <th style={{ padding: "12px", textAlign: "center", fontWeight: "600" }}>Cantidad</th>
                    <th style={{ padding: "12px", textAlign: "right", fontWeight: "600" }}>Precio Unit.</th>
                    <th style={{ padding: "12px", textAlign: "right", fontWeight: "600" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {quote.items.map((item, index) => (
                    <tr key={index} style={{ borderBottom: "1px solid #eee" }}>
                      <td style={{ padding: "12px" }}>
                        <code style={{ 
                          background: "#f5f5f5", 
                          padding: "4px 8px", 
                          borderRadius: "4px",
                          fontSize: "0.85rem"
                        }}>
                          {item.productCode}
                        </code>
                      </td>
                      <td style={{ padding: "12px" }}>
                        <div style={{ fontWeight: "600", marginBottom: "0.25rem" }}>{item.productName}</div>
                        {item.description && (
                          <div style={{ fontSize: "0.85rem", color: "#666", lineHeight: "1.4" }}>
                            {item.description}
                          </div>
                        )}
                        {item.externalProductId && (
                          <div style={{ fontSize: "0.75rem", color: "#999", marginTop: "0.25rem" }}>
                            ID: {item.externalProductId}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        <span style={{ 
                          background: "#e7f3ff", 
                          padding: "4px 12px", 
                          borderRadius: "12px",
                          fontWeight: "600",
                          fontSize: "0.9rem"
                        }}>
                          {item.quantity}
                        </span>
                      </td>
                      <td style={{ padding: "12px", textAlign: "right", fontWeight: "600" }}>
                        ${item.unitPrice.toFixed(2)}
                      </td>
                      <td style={{ padding: "12px", textAlign: "right" }}>
                        <strong style={{ fontSize: "1.1rem", color: "#27ae60" }}>
                          ${item.totalPrice.toFixed(2)}
                        </strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot style={{ background: "#f8f9fa" }}>
                  <tr>
                    <td colSpan={4} style={{ padding: "12px", textAlign: "right", fontWeight: "600" }}>
                      Subtotal:
                    </td>
                    <td style={{ padding: "12px", textAlign: "right", fontWeight: "600" }}>
                      ${quote.subtotal.toFixed(2)}
                    </td>
                  </tr>
                  {quote.tax > 0 && (
                    <tr>
                      <td colSpan={4} style={{ padding: "12px", textAlign: "right", fontWeight: "600" }}>
                        Impuestos:
                      </td>
                      <td style={{ padding: "12px", textAlign: "right", fontWeight: "600" }}>
                        ${quote.tax.toFixed(2)}
                      </td>
                    </tr>
                  )}
                  {quote.discount > 0 && (
                    <tr>
                      <td colSpan={4} style={{ padding: "12px", textAlign: "right", fontWeight: "600" }}>
                        Descuento:
                      </td>
                      <td style={{ padding: "12px", textAlign: "right", fontWeight: "600", color: "#e74c3c" }}>
                        -${quote.discount.toFixed(2)}
                      </td>
                    </tr>
                  )}
                  <tr style={{ borderTop: "2px solid #ddd" }}>
                    <td colSpan={4} style={{ padding: "12px", textAlign: "right", fontSize: "1.1rem", fontWeight: "700" }}>
                      TOTAL:
                    </td>
                    <td style={{ padding: "12px", textAlign: "right" }}>
                      <strong style={{ fontSize: "1.5rem", color: "#27ae60" }}>${quote.total.toFixed(2)}</strong>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </s-box>
        )}
      </s-section>

      {quote.notes && (
        <s-section heading="Notas e Información Adicional">
          <s-box padding="base" background="subdued">
            <div style={{ whiteSpace: "pre-wrap", lineHeight: "1.6" }}>{quote.notes}</div>
          </s-box>
        </s-section>
      )}
    </s-page>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

