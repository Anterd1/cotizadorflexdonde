/**
 * Servicio para enviar correos electrónicos usando Microsoft Graph API (Outlook)
 */

import { ClientSecretCredential } from "@azure/identity";
import { Client } from "@microsoft/microsoft-graph-client";
import { TokenCredentialAuthenticationProvider } from "@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials";
import type { Quote } from "../types/quote.types";

/**
 * Configuración de Outlook/Graph API
 */
function getOutlookConfig() {
  const clientId = process.env.OUTLOOK_CLIENT_ID;
  const clientSecret = process.env.OUTLOOK_CLIENT_SECRET;
  const tenantId = process.env.OUTLOOK_TENANT_ID;
  const fromEmail = process.env.OUTLOOK_FROM_EMAIL;

  if (!clientId || !clientSecret || !tenantId || !fromEmail) {
    throw new Error(
      "Faltan variables de entorno de Outlook: OUTLOOK_CLIENT_ID, OUTLOOK_CLIENT_SECRET, OUTLOOK_TENANT_ID, OUTLOOK_FROM_EMAIL"
    );
  }

  return { clientId, clientSecret, tenantId, fromEmail };
}

/**
 * Crea un cliente de Microsoft Graph autenticado
 */
async function getGraphClient() {
  const { clientId, clientSecret, tenantId } = getOutlookConfig();

  const credential = new ClientSecretCredential(
    tenantId,
    clientId,
    clientSecret
  );

  const authProvider = new TokenCredentialAuthenticationProvider(credential, {
    scopes: ["https://graph.microsoft.com/.default"],
  });

  return Client.initWithMiddleware({ authProvider });
}

/**
 * Genera el HTML del email para la sucursal
 */
function generateBranchEmailHTML(quote: Quote): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .quote-info { background-color: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .items-table th, .items-table td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        .items-table th { background-color: #4CAF50; color: white; }
        .total { font-size: 18px; font-weight: bold; text-align: right; margin-top: 20px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Nueva Cotización Recibida</h1>
        </div>
        <div class="content">
          <div class="quote-info">
            <h2>Cotización #${quote.quoteNumber}</h2>
            <p><strong>Cliente:</strong> ${quote.customerName}</p>
            <p><strong>Email:</strong> ${quote.customerEmail}</p>
            ${quote.customerPhone ? `<p><strong>Teléfono:</strong> ${quote.customerPhone}</p>` : ""}
            <p><strong>Estado:</strong> ${quote.status}</p>
            <p><strong>Válida hasta:</strong> ${new Date(quote.validUntil).toLocaleDateString()}</p>
          </div>

          <h3>Artículos Cotizados:</h3>
          <table class="items-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Precio Unit.</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${quote.items
                .map(
                  (item) => `
                <tr>
                  <td>${item.productCode}</td>
                  <td>${item.productName}</td>
                  <td>${item.quantity}</td>
                  <td>$${item.unitPrice.toFixed(2)}</td>
                  <td>$${item.totalPrice.toFixed(2)}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>

          <div class="total">
            <p>Subtotal: $${quote.subtotal.toFixed(2)}</p>
            ${quote.tax > 0 ? `<p>Impuestos: $${quote.tax.toFixed(2)}</p>` : ""}
            ${quote.discount > 0 ? `<p>Descuento: -$${quote.discount.toFixed(2)}</p>` : ""}
            <p>TOTAL: $${quote.total.toFixed(2)}</p>
          </div>

          ${quote.notes ? `<div class="quote-info"><strong>Notas:</strong><p>${quote.notes}</p></div>` : ""}
        </div>
        <div class="footer">
          <p>Este es un email automático del sistema de cotizaciones.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Genera el HTML del email para el cliente
 */
function generateCustomerEmailHTML(quote: Quote): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .quote-info { background-color: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .items-table th, .items-table td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        .items-table th { background-color: #2196F3; color: white; }
        .total { font-size: 18px; font-weight: bold; text-align: right; margin-top: 20px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Cotización #${quote.quoteNumber}</h1>
        </div>
        <div class="content">
          <p>Estimado/a <strong>${quote.customerName}</strong>,</p>
          <p>Gracias por su interés. Adjuntamos la cotización solicitada:</p>

          <div class="quote-info">
            <p><strong>Válida hasta:</strong> ${new Date(quote.validUntil).toLocaleDateString()}</p>
            <p><strong>Estado:</strong> ${quote.status}</p>
          </div>

          <h3>Detalle de la Cotización:</h3>
          <table class="items-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Precio Unit.</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${quote.items
                .map(
                  (item) => `
                <tr>
                  <td>${item.productCode}</td>
                  <td>${item.productName}</td>
                  <td>${item.quantity}</td>
                  <td>$${item.unitPrice.toFixed(2)}</td>
                  <td>$${item.totalPrice.toFixed(2)}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>

          <div class="total">
            <p>Subtotal: $${quote.subtotal.toFixed(2)}</p>
            ${quote.tax > 0 ? `<p>Impuestos: $${quote.tax.toFixed(2)}</p>` : ""}
            ${quote.discount > 0 ? `<p>Descuento: -$${quote.discount.toFixed(2)}</p>` : ""}
            <p><strong>TOTAL: $${quote.total.toFixed(2)}</strong></p>
          </div>

          ${quote.notes ? `<div class="quote-info"><strong>Notas:</strong><p>${quote.notes}</p></div>` : ""}

          <p>Si tiene alguna pregunta, no dude en contactarnos.</p>
        </div>
        <div class="footer">
          <p>Este es un email automático. Por favor no responda a este mensaje.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Envía un email usando Microsoft Graph API
 */
async function sendEmail(
  to: string,
  subject: string,
  htmlBody: string
): Promise<void> {
  const { fromEmail } = getOutlookConfig();
  const client = await getGraphClient();

  const message = {
    message: {
      subject,
      body: {
        contentType: "HTML",
        content: htmlBody,
      },
      toRecipients: [
        {
          emailAddress: {
            address: to,
          },
        },
      ],
    },
  };

  try {
    await client.api(`/users/${fromEmail}/sendMail`).post(message);
  } catch (error) {
    console.error("Error enviando email:", error);
    throw new Error(`Error al enviar email: ${error instanceof Error ? error.message : "Error desconocido"}`);
  }
}

/**
 * Envía los emails de cotización (a sucursal y cliente)
 */
export async function sendQuoteEmails(quote: Quote): Promise<void> {
  const subject = `Cotización #${quote.quoteNumber} - ${quote.customerName}`;

  // Enviar email a la sucursal
  const branchHTML = generateBranchEmailHTML(quote);
  await sendEmail(quote.branchEmail, `[Sucursal] ${subject}`, branchHTML);

  // Enviar email al cliente
  const customerHTML = generateCustomerEmailHTML(quote);
  await sendEmail(quote.customerEmail, subject, customerHTML);
}

