import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData, Link, useRouteError, useNavigate, useFetcher } from "react-router";
import { authenticate } from "../shopify.server";
import { getQuotes } from "../services/metaobjects.server";
import { boundary } from "@shopify/shopify-app-react-router/server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const shopId = session.shop;

  const quotes = await getQuotes(admin, shopId);

  return { quotes };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  // Acción vacía por ahora, ya que se eliminó la creación de pruebas
  return { error: "Acción no válida" };
};

export default function QuotesList() {
  const { quotes } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  
  const handleNewQuote = () => {
    try {
      navigate("/app/quotes/new");
    } catch (error) {
      console.error("Error navegando:", error);
      window.location.href = "/app/quotes/new";
    }
  };

  // Calcular estadísticas
  const stats = {
    total: quotes.length,
    totalAmount: quotes.reduce((sum, q) => sum + q.total, 0),
  };

  // Ordenar por fecha (más recientes primero)
  const sortedQuotes = [...quotes].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const hasLoanOption = (quote: typeof quotes[0]) => {
    return quote.notes?.includes('Opción de Préstamo') || quote.notes?.includes('Préstamo Seleccionada');
  };

  return (
    <s-page heading="Cotizaciones">
      {/* Estadísticas Minimalistas */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
        gap: "20px", 
        marginBottom: "32px",
        width: "100%",
        maxWidth: "100%"
      }}>
        <div style={{ 
          padding: "24px", 
          background: "#ffffff", 
          borderRadius: "8px", 
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          border: "1px solid #e1e3e5"
        }}>
          <div style={{ fontSize: "13px", color: "#6d7175", fontWeight: "500", marginBottom: "4px" }}>Total</div>
          <div style={{ fontSize: "24px", fontWeight: "600", color: "#202223" }}>{stats.total}</div>
        </div>
        <div style={{ 
          padding: "24px", 
          background: "#ffffff", 
          borderRadius: "8px", 
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          border: "1px solid #e1e3e5"
        }}>
          <div style={{ fontSize: "13px", color: "#6d7175", fontWeight: "500", marginBottom: "4px" }}>Valor Total</div>
          <div style={{ fontSize: "24px", fontWeight: "600", color: "#202223" }}>${stats.totalAmount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
      </div>

      <s-section heading="Listado">
        {quotes.length === 0 ? (
          <s-box padding="base" background="subdued">
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <div style={{ fontSize: "16px", color: "#6d7175", marginBottom: "16px" }}>No hay cotizaciones registradas</div>
              <s-button onClick={handleNewQuote}>Crear primera cotización</s-button>
            </div>
          </s-box>
        ) : (
          <div style={{ overflowX: "auto", width: "100%" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "900px", fontSize: "14px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #e1e3e5", background: "#f7f8fa" }}>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: "600", color: "#444" }}>Folio</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: "600", color: "#444" }}>Cliente</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: "600", color: "#444" }}>Contacto</th>
                    <th style={{ padding: "12px 16px", textAlign: "center", fontWeight: "600", color: "#444" }}>Items</th>
                    <th style={{ padding: "12px 16px", textAlign: "right", fontWeight: "600", color: "#444" }}>Monto</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: "600", color: "#444" }}>Fecha</th>
                    <th style={{ padding: "12px 16px", textAlign: "center", fontWeight: "600", color: "#444" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {sortedQuotes.map((quote) => (
                    <tr key={quote.id} style={{ borderBottom: "1px solid #f1f2f3" }}>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontWeight: "600", color: "#202223" }}>{quote.quoteNumber}</span>
                          {hasLoanOption(quote) && (
                            <span 
                              title="Incluye opción de préstamo" 
                              style={{ 
                                fontSize: "10px", 
                                background: "#e4e5e7", 
                                padding: "2px 6px", 
                                borderRadius: "4px", 
                                color: "#5c5f62" 
                              }}>
                              LOAN
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: "500", color: "#202223" }}>
                        {quote.customerName}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ color: "#5c5f62" }}>{quote.customerEmail}</div>
                        {quote.customerPhone && <div style={{ fontSize: "12px", color: "#8c9196" }}>{quote.customerPhone}</div>}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        {quote.items.length > 0 ? (
                          <span style={{ background: "#f1f2f3", padding: "2px 8px", borderRadius: "10px", fontSize: "12px", color: "#5c5f62" }}>
                            {quote.items.length}
                          </span>
                        ) : (
                          <span style={{ color: "#aeb4b9" }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right", fontFamily: "monospace", fontWeight: "500" }}>
                        ${quote.total.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ color: "#202223" }}>
                          {new Date(quote.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' })}
                        </div>
                        <div style={{ fontSize: "11px", color: "#8c9196" }}>
                          {new Date(quote.createdAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        <a 
                          href={`/app/quotes/${encodeURIComponent(quote.id || "")}`}
                          style={{ 
                            textDecoration: "none", 
                            color: "#008060",
                            fontWeight: "600",
                            fontSize: "13px",
                            border: "1px solid #cce5dd",
                            padding: "6px 12px",
                            borderRadius: "4px",
                            background: "#f1f8f5",
                            transition: "all 0.2s"
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.background = "#e0f2ec";
                            e.currentTarget.style.borderColor = "#b8dbd1";
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = "#f1f8f5";
                            e.currentTarget.style.borderColor = "#cce5dd";
                          }}
                        >
                          Ver
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
          </div>
        )}
      </s-section>
    </s-page>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}
