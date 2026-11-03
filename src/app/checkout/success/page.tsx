import { OrderStatus } from "@/components/order-status";
import { Suspense } from "react";

export const metadata = { title: "Order" };

export default function SuccessPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <Suspense fallback={<p>Loading your order…</p>}>
        <OrderStatus />
      </Suspense>
    </div>
  );
}
