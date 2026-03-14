import "server-only";

import { type CartState } from "@acme/platform-core/cart";
import { sendSystemEmail } from "@acme/platform-core/email";

import { CONTACT_EMAIL, LEGAL_ENTITY_NAME, PROPERTY_ADDRESS } from "@/lib/legalContent";

function escHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
}

export function merchantEmail(): string {
  return process.env.MERCHANT_NOTIFY_EMAIL ?? "peter.cowling1976@gmail.com";
}

export async function sendCheckoutAlert(subject: string, html: string): Promise<void> {
  try {
    await sendSystemEmail({
      to: merchantEmail(),
      subject,
      html,
    });
  } catch (err) {
    console.error("Checkout alert email failed", err); // i18n-exempt -- developer log
  }
}

export function dispatchMerchantOrderEmail(
  cart: CartState,
  totalCents: number,
  shopTransactionId: string,
  paymentReference?: string,
  providerLabel?: string,
): void {
  const itemLines = Object.values(cart)
    .map(
      (line) =>
        `<tr><td>${escHtml(line.sku.title)}</td><td>${line.qty}</td><td>EUR ${(line.sku.price / 100).toFixed(2)}</td><td>EUR ${((line.sku.price * line.qty) / 100).toFixed(2)}</td></tr>`,
    )
    .join("");
  const referenceLabel = providerLabel ?? "Payment ref";
  const emailHtml = `
      <h2>New order received</h2>
      <table border="1" cellpadding="4" cellspacing="0">
        <thead><tr><th>Item</th><th>Qty</th><th>Unit price</th><th>Line total</th></tr></thead>
        <tbody>${itemLines}</tbody>
      </table>
      <p><strong>Total: EUR ${(totalCents / 100).toFixed(2)}</strong></p>
      <p>Transaction ID: ${escHtml(shopTransactionId)}</p>
      <p>${escHtml(referenceLabel)}: ${escHtml(paymentReference ?? "")}</p>
    `;
  void sendSystemEmail({
    to: merchantEmail(),
    subject: `New order — ${shopTransactionId}`,
    html: emailHtml,
  }).catch((err: unknown) => {
    console.error("Merchant notification email failed", err); // i18n-exempt -- developer log
  });
}

export function dispatchCustomerConfirmationEmail(params: {
  buyerName?: string;
  buyerEmail?: string;
  cart: CartState;
  totalCents: number;
  shopTransactionId: string;
  paymentReference?: string;
}): void {
  const recipientEmail = params.buyerEmail?.trim();
  if (!recipientEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
    return;
  }

  const customerItemLines = Object.values(params.cart)
    .map(
      (line) =>
        `<tr><td>${escHtml(line.sku.title)}</td><td>${line.qty}</td><td>EUR ${(line.sku.price / 100).toFixed(2)}</td><td>EUR ${((line.sku.price * line.qty) / 100).toFixed(2)}</td></tr>`,
    )
    .join("");

  const emailHtml = `
      <h2>Order confirmed — thank you!</h2>
      <p>Hi${params.buyerName ? ` ${escHtml(params.buyerName)}` : ""},</p>
      <p>Your order has been received and payment processed successfully.</p>
      <table border="1" cellpadding="4" cellspacing="0">
        <thead><tr><th>Item</th><th>Qty</th><th>Unit price</th><th>Line total</th></tr></thead>
        <tbody>${customerItemLines}</tbody>
      </table>
      <p><strong>Total: EUR ${(params.totalCents / 100).toFixed(2)}</strong></p>
      <p>Order reference: ${escHtml(params.shopTransactionId)}</p>
      <p>Payment reference: ${escHtml(params.paymentReference ?? "")}</p>
      <p>If you need to request a cancellation, return, exchange request, faulty-item review, or privacy help, reply to this email or contact ${escHtml(CONTACT_EMAIL)}.</p>
      <p>Policies:</p>
      <ul>
        <li><a href="https://caryina.com/en/terms">Terms of Sale and Website Use</a></li>
        <li><a href="https://caryina.com/en/privacy">Privacy Policy</a></li>
        <li><a href="https://caryina.com/en/cookie-policy">Cookie Policy</a></li>
        <li><a href="https://caryina.com/en/returns">Returns Policy</a></li>
      </ul>
      <p>Business details: ${escHtml(LEGAL_ENTITY_NAME)}, ${escHtml(PROPERTY_ADDRESS)}.</p>
    `;

  void sendSystemEmail({
    to: recipientEmail,
    subject: `Order confirmed — ${params.shopTransactionId}`,
    html: emailHtml,
  }).catch((err: unknown) => {
    console.error("Customer confirmation email failed", err); // i18n-exempt -- developer log
  });
}
