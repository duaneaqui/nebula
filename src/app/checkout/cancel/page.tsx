import Link from "next/link";

export const metadata = { title: "Checkout canceled" };

export default function CancelPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <div className="plaza-card p-8">
        <h1 className="font-display text-4xl">Checkout canceled</h1>
        <p className="mt-3 text-[#3d5158]">No charge was made. Your cart is still here.</p>
        <Link href="/cart" className="btn btn-orange mt-6">
          Back to cart
        </Link>
      </div>
    </div>
  );
}
