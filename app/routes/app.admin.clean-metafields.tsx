/**
 * Ruta administrativa para limpiar metafields antiguos
 * PRECAUCIÓN: Esta acción elimina datos permanentemente
 */

import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useFetcher, useRouteError } from "react-router";
import { authenticate } from "../shopify.server";
import { cleanOldMetafields } from "../scripts/clean-old-metafields";
import { boundary } from "@shopify/shopify-app-react-router/server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return { ready: true };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  try {
    const result = await cleanOldMetafields(admin);
    return { 
      success: true, 
      deleted: result.deleted,
      errors: result.errors
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error limpiando metafields",
    };
  }
};

export default function CleanMetafields() {
  const fetcher = useFetcher<typeof action>();

  const handleClean = () => {
    if (
      confirm(
        "⚠️ ADVERTENCIA: Esta acción eliminará PERMANENTEMENTE todas las cotizaciones antiguas guardadas como Metafields.\n\n" +
        "Solo continúa si:\n" +
        "1. Ya verificaste que las cotizaciones nuevas se guardan correctamente como Metaobjetos\n" +
        "2. No necesitas las cotizaciones antiguas (COT-2025-XXXX)\n\n" +
        "¿Estás seguro de continuar?"
      )
    ) {
      fetcher.submit({}, { method: "POST" });
    }
  };

  return (
    <s-page heading="Limpiar Metafields Antiguos">
      <s-section>
        <s-box padding="base" background="subdued">
          <s-stack direction="block" gap="base">
            <div style={{ padding: "1rem", background: "#fff3cd", borderRadius: "8px", border: "2px solid #ffeaa7" }}>
              <strong style={{ color: "#856404" }}>⚠️ ADVERTENCIA</strong>
              <p style={{ marginTop: "0.5rem", color: "#856404" }}>
                Esta herramienta elimina PERMANENTEMENTE las cotizaciones antiguas guardadas como Metafields del Shop.
              </p>
              <p style={{ marginTop: "0.5rem", color: "#856404" }}>
                Solo usa esto después de verificar que el sistema de Metaobjetos funciona correctamente.
              </p>
            </div>

            <div>
              <strong>¿Qué se eliminará?</strong>
              <ul style={{ marginTop: "0.5rem" }}>
                <li>Metafields con namespace: "cotizador"</li>
                <li>Keys que empiezan con: "quote_"</li>
                <li>Cotizaciones antiguas: COT-2025-XXXX</li>
              </ul>
            </div>

            <div>
              <strong>¿Qué NO se eliminará?</strong>
              <ul style={{ marginTop: "0.5rem" }}>
                <li>✅ Cotizaciones nuevas (Metaobjetos COT-1, COT-2, etc.)</li>
                <li>✅ Otros metafields de la tienda</li>
                <li>✅ Datos de productos, clientes, etc.</li>
              </ul>
            </div>

            <s-button
              variant="primary"
              onClick={handleClean}
              disabled={fetcher.state === "submitting"}
            >
              {fetcher.state === "submitting" ? "Eliminando..." : "🗑️ Eliminar Metafields Antiguos"}
            </s-button>
          </s-stack>
        </s-box>

        {fetcher.data?.success && (
          <s-box padding="base" style={{ marginTop: "1rem" }}>
            <div style={{ padding: "1rem", background: "#e8f5e9", borderRadius: "8px", border: "2px solid #c3e6cb" }}>
              <strong style={{ color: "#2e7d32" }}>✅ Limpieza Completada</strong>
              <p style={{ marginTop: "0.5rem", color: "#2e7d32" }}>
                Metafields eliminados: <strong>{fetcher.data.deleted}</strong>
              </p>
              {fetcher.data.errors && fetcher.data.errors.length > 0 && (
                <div style={{ marginTop: "0.5rem" }}>
                  <strong style={{ color: "#d32f2f" }}>Errores:</strong>
                  <ul>
                    {fetcher.data.errors.map((error: string, idx: number) => (
                      <li key={idx} style={{ color: "#d32f2f" }}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </s-box>
        )}

        {fetcher.data?.error && (
          <s-box padding="base" style={{ marginTop: "1rem" }}>
            <div style={{ padding: "1rem", background: "#ffebee", borderRadius: "8px", border: "2px solid #f5c6cb" }}>
              <strong style={{ color: "#c62828" }}>❌ Error</strong>
              <p style={{ marginTop: "0.5rem", color: "#c62828" }}>
                {fetcher.data.error}
              </p>
            </div>
          </s-box>
        )}
      </s-section>
    </s-page>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}


