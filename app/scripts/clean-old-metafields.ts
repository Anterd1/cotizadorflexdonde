/**
 * Script para eliminar metafields antiguos del namespace "cotizador"
 * Ejecutar SOLO después de validar que los metaobjetos funcionan correctamente
 * 
 * USO:
 * Este script se ejecuta desde una ruta de la app para seguridad
 * Ve a /app/admin/clean-metafields en tu navegador
 */

import type { AdminApiContext } from "@shopify/shopify-app-react-router/server";

const METAFIELD_NAMESPACE = "cotizador";

export async function cleanOldMetafields(admin: AdminApiContext): Promise<{
  deleted: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let deleted = 0;

  try {
    console.log("🧹 [Cleanup] Iniciando limpieza de metafields antiguos...");
    console.log("🧹 [Cleanup] Namespace:", METAFIELD_NAMESPACE);

    // 1. Obtener el shop GID
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

    console.log("✅ [Cleanup] Shop GID obtenido:", shopGid);

    // 2. Obtener todos los metafields del namespace "cotizador"
    const response = await admin.graphql(
      `#graphql
        query getShopMetafields($namespace: String!) {
          shop {
            metafields(first: 250, namespace: $namespace) {
              edges {
                node {
                  id
                  key
                  namespace
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

    console.log(`🔍 [Cleanup] ${metafields.length} metafields encontrados`);

    if (metafields.length === 0) {
      console.log("✅ [Cleanup] No hay metafields para eliminar");
      return { deleted: 0, errors: [] };
    }

    // 3. Eliminar cada metafield
    for (const edge of metafields) {
      const metafieldId = edge.node.id;
      const metafieldKey = edge.node.key;

      try {
        console.log(`🗑️ [Cleanup] Eliminando metafield: ${metafieldKey}`);

        const deleteResponse = await admin.graphql(
          `#graphql
            mutation metafieldDelete($input: MetafieldDeleteInput!) {
              metafieldDelete(input: $input) {
                deletedId
                userErrors {
                  field
                  message
                }
              }
            }
          `,
          {
            variables: {
              input: {
                id: metafieldId,
              },
            },
          }
        );

        const deleteResult = await deleteResponse.json();

        if (deleteResult.data?.metafieldDelete?.userErrors?.length > 0) {
          const error = deleteResult.data.metafieldDelete.userErrors
            .map((e: { message: string }) => e.message)
            .join(", ");
          console.error(`❌ [Cleanup] Error eliminando ${metafieldKey}:`, error);
          errors.push(`${metafieldKey}: ${error}`);
        } else {
          deleted++;
          console.log(`✅ [Cleanup] Eliminado: ${metafieldKey}`);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`❌ [Cleanup] Error eliminando ${metafieldKey}:`, errorMsg);
        errors.push(`${metafieldKey}: ${errorMsg}`);
      }
    }

    console.log(`✅ [Cleanup] Limpieza completada. Eliminados: ${deleted}, Errores: ${errors.length}`);
    return { deleted, errors };
  } catch (error) {
    console.error("❌ [Cleanup] Error en limpieza:", error);
    throw error;
  }
}


