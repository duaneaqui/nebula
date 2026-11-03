import "server-only";

import { paypalConfigured } from "@/lib/paypal";
import { paymongoConfigured } from "@/lib/paymongo";

export type PaymentMethod = "test" | "qrph" | "paypal" | "stripe";

export type PaymentsAvailability = {
  test: boolean;
  qrph: boolean;
  paypal: boolean;
  stripe: boolean;
};

/** @deprecated Prefer paymentMethods(). Kept for older banner checks. */
export type PaymentsMode = "stripe" | "test" | "off" | "live";

export function paymentMethods(): PaymentsAvailability {
  const stripe = Boolean(process.env.STRIPE_SECRET_KEY?.trim() && process.env.STRIPE_WEBHOOK_SECRET?.trim());
  const test = process.env.NODE_ENV !== "production" && process.env.STORE_DEV_CHECKOUT === "true";
  return {
    test,
    qrph: paymongoConfigured(),
    paypal: paypalConfigured(),
    stripe,
  };
}

export function paymentsMode(): PaymentsMode {
  const methods = paymentMethods();
  if (methods.test) return "test";
  if (methods.qrph || methods.paypal || methods.stripe) return "live";
  return "off";
}

export function anyLivePayments() {
  const methods = paymentMethods();
  return methods.qrph || methods.paypal || methods.stripe;
}

export function supportEmail() {
  return process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() ?? "";
}

export function discordUrl() {
  const url = process.env.NEXT_PUBLIC_DISCORD_URL?.trim() ?? "";
  if (!url.startsWith("https://")) return "";
  return url;
}

export function serverAddress() {
  return process.env.NEXT_PUBLIC_SERVER_ADDRESS?.trim() ?? "";
}
