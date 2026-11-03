import { CheckoutForm } from "@/components/checkout-form";
import { paymentMethods } from "@/lib/config";
import { phpPerUsd } from "@/lib/currency";

export const metadata = { title: "Checkout" };

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <CheckoutForm methods={paymentMethods()} phpRate={phpPerUsd()} />
    </div>
  );
}
