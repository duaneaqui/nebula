import { CartView } from "@/components/cart-view";

export const metadata = { title: "Cart" };

export default function CartPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <CartView />
    </div>
  );
}
