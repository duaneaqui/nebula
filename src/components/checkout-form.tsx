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

type AppliedVoucher = {
  code: string;
  percentOff: number;
  discountCents: number;
  totalCents: number;
};

export function CheckoutForm({ methods, phpRate }: { methods: PaymentsAvailability; phpRate: number }) {
  const { ready, lines, username } = useCart();
  const { currency, format, formatUsd, formatPhp } = useCurrency();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [seeded, setSeeded] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<Method | null>(null);
  const [voucherInput, setVoucherInput] = useState("");
  const [voucher, setVoucher] = useState<AppliedVoucher | null>(null);
  const [voucherPending, setVoucherPending] = useState(false);
  const [voucherError, setVoucherError] = useState<string | null>(null);
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

  const subtotal = detailed.reduce((sum, entry) => sum + entry.total, 0);
  const total = voucher ? voucher.totalCents : subtotal;
  const anyMethod = methods.test || methods.qrph || methods.paypal || methods.stripe;
  const rate = phpRate;
  const cartItems = detailed.map((entry) => ({ productId: entry.product.id, quantity: entry.line.quantity }));

  async function applyVoucher() {
    setVoucherPending(true);
    setVoucherError(null);
    try {
      const response = await fetch("/api/voucher", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: voucherInput, items: cartItems }),
      });
      const data = (await response.json()) as AppliedVoucher & { error?: string; percentOff?: number };
      if (!response.ok || data.error || !data.code) {
        setVoucher(null);
        setVoucherError(data.error ?? "Could not apply voucher.");
        return;
      }
      setVoucher({
        code: data.code,
        percentOff: data.percentOff ?? 0,
        discountCents: data.discountCents,
        totalCents: data.totalCents,
      });
      setVoucherInput(data.code);
    } catch {
      setVoucher(null);
      setVoucherError("Could not apply voucher.");
    } finally {
      setVoucherPending(false);
    }
  }

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
          voucherCode: voucher?.code || voucherInput.trim() || undefined,
          items: cartItems,
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
          Premium Java, cracked/offline Java, and Bedrock (Floodgate dot) are all accepted — use the exact in-game name.
          Rank and Stardust can arrive offline. Crate keys wait until that player is online. A receipt is emailed when
          payment clears.
        </p>

        <div className="grid gap-2 rounded-2xl border border-[#12343c]/10 bg-[#f8f5ef] p-4">
          <label className="grid gap-1 text-sm font-semibold" htmlFor="voucher">
            Voucher code
            <span className="font-normal text-[#5c6d73]">Optional one-time percent discount</span>
          </label>
          <div className="flex flex-wrap gap-2">
            <input
              id="voucher"
              className="field min-w-0 flex-1 font-normal uppercase"
              spellCheck={false}
              value={voucherInput}
              onChange={(event) => {
                setVoucherInput(event.target.value);
                setVoucher(null);
                setVoucherError(null);
              }}
              placeholder="NEBULA-XXXX"
            />
            <button
              className="btn btn-ghost shrink-0"
              type="button"
              disabled={voucherPending || !voucherInput.trim()}
              onClick={() => void applyVoucher()}
            >
              {voucherPending ? "Checking…" : "Apply"}
            </button>
          </div>
          {voucher ? (
            <p className="text-sm font-semibold text-[#0f766e]">
              {voucher.percentOff}% off with {voucher.code} (−{format(voucher.discountCents)})
            </p>
          ) : null}
          {voucherError ? <p className="text-sm text-[#9d2348]">{voucherError}</p> : null}
        </div>

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
                disabled={Boolean(pending) || !accepted || !email || !name || total === 0}
                onClick={() => void startCheckout("qrph")}
              >
                {pending === "qrph" ? "Opening QR Ph…" : `QR Ph · ${formatPhp(total)}`}
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
                disabled={Boolean(pending) || !accepted || !email || !name || total === 0}
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
                disabled={Boolean(pending) || !accepted || !email || !name || total === 0}
                onClick={() => void startCheckout("stripe")}
              >
                {pending === "stripe" ? "Opening Stripe…" : `Card (Stripe) · ${formatUsd(total)}`}
              </button>
            ) : null}

            {total === 0 ? (
              <button
                className="btn btn-orange w-full"
                type="button"
                disabled={Boolean(pending) || !accepted || !email || !name}
                onClick={() =>
                  void startCheckout(
                    methods.test ? "test" : methods.paypal ? "paypal" : methods.qrph ? "qrph" : "stripe",
                  )
                }
              >
                {pending ? "Claiming…" : "Claim free with voucher"}
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
        {voucher ? (
          <p className="mt-4 flex justify-between text-sm text-[#0f766e]">
            <span>
              Voucher {voucher.code} (−{voucher.percentOff}%)
            </span>
            <span>−{format(voucher.discountCents)}</span>
          </p>
        ) : null}
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
