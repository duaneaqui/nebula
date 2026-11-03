"use client";

import { useCart } from "@/components/cart-provider";
import { useCurrency } from "@/components/currency-provider";
import { CurrencyToggle } from "@/components/currency-toggle";
import { PriceTag } from "@/components/price-tag";
import { getProduct } from "@/lib/catalog";
import type { PaymentsAvailability } from "@/lib/payments-public";
import Link from "next/link";
import { useEffect, useState } from "react";

type Method = "test" | "qrph" | "paypal" | "stripe";

export function CheckoutForm({ methods, phpRate }: { methods: PaymentsAvailability; phpRate: number }) {
  const { ready, lines, username } = useCart();
  const { currency, format, formatUsd, formatPhp } = useCurrency();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [seeded, setSeeded] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<Method | null>(null);
  const paypalCurrency = currency;

  useEffect(() => {
    if (ready && !seeded) {
      setName(username);
      setSeeded(true);
    }
  }, [ready, seeded, username]);

  if (!ready) return <p>Loading checkout…</p>;

  const detailed = lines
    .map((line) => {
      const product = getProduct(line.productId);
      if (!product) return null;
      return { line, product, total: product.priceCents * line.quantity };
    })
    .filter((entry) => entry !== null);

  if (detailed.length === 0) {
    return (
      <div className="plaza-card p-8">
        <h1 className="font-display text-4xl">Nothing to check out</h1>
        <Link href="/store/ranks" className="btn btn-orange mt-6">
          Browse ranks
        </Link>
      </div>
    );
  }

  const total = detailed.reduce((sum, entry) => sum + entry.total, 0);
  const anyMethod = methods.test || methods.qrph || methods.paypal || methods.stripe;
  const rate = phpRate;

  async function startCheckout(method: Method) {
    setPending(method);
    setError(null);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          username: name,
          acceptedTerms: accepted,
          method,
          paypalCurrency,
          items: detailed.map((entry) => ({ productId: entry.product.id, quantity: entry.line.quantity })),
        }),
      });
      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) {
        setError(data.error ?? "Checkout failed.");
        setPending(null);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Checkout failed.");
      setPending(null);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="plaza-card grid gap-4 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-4xl">Checkout</h1>
          <CurrencyToggle tone="light" />
        </div>
        <label className="grid gap-1 text-sm font-semibold" htmlFor="email">
          Email for the receipt
          <input
            id="email"
            className="field font-normal"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label className="grid gap-1 text-sm font-semibold" htmlFor="ign">
          Minecraft username
          <input
            id="ign"
            className="field font-normal"
            required
            maxLength={16}
            spellCheck={false}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <p className="text-sm leading-6 text-[#3d5158]">
          Java names are checked with Mojang before payment. Bedrock names need the Floodgate dot. Rank and Stardust can
          arrive offline. Crate keys wait until that player is online.
        </p>
        <label className="flex items-start gap-2 text-sm leading-6">
          <input
            className="mt-1"
            type="checkbox"
            checked={accepted}
            onChange={(event) => setAccepted(event.target.checked)}
          />
          <span>
            I understand this is delivered to a Minecraft account, and a completed delivery is not refunded. See the{" "}
            <Link href="/terms" className="underline">
              terms
            </Link>
            .
          </span>
        </label>
        {error ? <p className="text-sm text-[#9d2348]">{error}</p> : null}

        {!anyMethod ? (
          <p className="rounded-2xl bg-[#fff1e6] px-4 py-3 text-sm text-[#9a3412]">
            Payments are not switched on yet. Add PayMongo (QR Ph) and/or PayPal keys.
          </p>
        ) : (
          <div className="grid gap-3">
            <p className="text-xs font-bold tracking-[0.14em] text-[#0f766e] uppercase">Pay with</p>

            {methods.qrph ? (
              <button
                className="btn btn-orange w-full"
                type="button"
                disabled={Boolean(pending) || !accepted || !email || !name}
                onClick={() => void startCheckout("qrph")}
              >
                {pending === "qrph"
                  ? "Opening QR Ph…"
                  : `QR Ph · ${formatPhp(total)}`}
              </button>
            ) : null}
            {methods.qrph ? (
              <p className="text-xs leading-5 text-[#5c6d73]">
                Scan with GCash, Maya, or a bank app. Converted at ₱{rate.toFixed(2)} per $1.
              </p>
            ) : null}

            {methods.paypal ? (
              <button
                className="btn btn-teal w-full"
                type="button"
                disabled={Boolean(pending) || !accepted || !email || !name}
                onClick={() => void startCheckout("paypal")}
              >
                {pending === "paypal"
                  ? "Opening PayPal…"
                  : `PayPal · ${paypalCurrency === "USD" ? formatUsd(total) : formatPhp(total)}`}
              </button>
            ) : null}
            {methods.paypal ? (
              <p className="text-xs leading-5 text-[#5c6d73]">
                PayPal charges in {paypalCurrency}. PHP uses the same ₱{rate.toFixed(2)} / $1 rate as the price switch.
              </p>
            ) : null}

            {methods.stripe ? (
              <button
                className="btn btn-ghost w-full"
                type="button"
                disabled={Boolean(pending) || !accepted || !email || !name}
                onClick={() => void startCheckout("stripe")}
              >
                {pending === "stripe" ? "Opening Stripe…" : `Card (Stripe) · ${formatUsd(total)}`}
              </button>
            ) : null}

            {methods.test ? (
              <button
                className="btn btn-ghost w-full"
                type="button"
                disabled={Boolean(pending) || !accepted || !email || !name}
                onClick={() => void startCheckout("test")}
              >
                {pending === "test" ? "Delivering…" : "Complete test delivery"}
              </button>
            ) : null}
          </div>
        )}
      </div>
      <aside className="plaza-card h-fit p-6">
        <h2 className="font-display text-2xl">Your order</h2>
        <ul className="mt-4 grid gap-3 text-sm">
          {detailed.map(({ product, line, total: lineTotal }) => (
            <li key={product.id} className="flex justify-between gap-4">
              <span>
                {product.name} × {line.quantity}
              </span>
              <span>
                <PriceTag priceCents={lineTotal} compareAtCents={undefined} size="sm" />
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4 flex justify-between border-t border-[#12343c]/10 pt-4 font-display text-2xl">
          <span>Total</span>
          <span>{format(total)}</span>
        </p>
        {currency === "USD" ? (
          <p className="mt-2 text-sm text-[#5c6d73]">About {formatPhp(total)} at ₱{rate.toFixed(2)} / $1</p>
        ) : (
          <p className="mt-2 text-sm text-[#5c6d73]">Catalog base {formatUsd(total)} · rate ₱{rate.toFixed(2)} / $1</p>
        )}
      </aside>
    </div>
  );
}
