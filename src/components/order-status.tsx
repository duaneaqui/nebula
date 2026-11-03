"use client";

import { useCart } from "@/components/cart-provider";
import { useCurrency } from "@/components/currency-provider";
import { ORDER_DELIVERED_ART } from "@/lib/art";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type OrderView = {
  id: string;
  status: string;
  username: string;
  totalCents: number;
  items: { name: string; quantity: number; lineCents: number }[];
  delivery: { done: number; waiting: number; waitingOnline: number; failed: number };
};

export function OrderStatus() {
  const params = useSearchParams();
  const id = params.get("order");
  const { clear } = useCart();
  const { format } = useCurrency();
  const [order, setOrder] = useState<OrderView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cleared = useRef(false);

  useEffect(() => {
    if (!id) return;
    let stopped = false;

    const load = async () => {
      const response = await fetch(`/api/orders/${id}`);
      const data = (await response.json()) as OrderView & { error?: string };
      if (stopped) return false;
      if (!response.ok) {
        setError(data.error ?? "Order not found.");
        return true;
      }
      setOrder(data);
      if (!cleared.current && (data.status === "paid" || data.status === "fulfilled" || data.status === "problem")) {
        cleared.current = true;
        clear();
      }
      return data.status === "fulfilled" || data.status === "problem";
    };

    void load();
    const timer = window.setInterval(() => {
      void load().then((done) => {
        if (done) window.clearInterval(timer);
      });
    }, 4000);
    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, [id, clear]);

  if (!id) return <p>Missing order id.</p>;
  if (error) return <p className="text-[#9d2348]">{error}</p>;
  if (!order) return <p>Loading your order…</p>;

  const message = describe(order);

  const showDeliveryArt =
    order.delivery.done > 0 && order.delivery.waiting === 0 && order.delivery.waitingOnline === 0 && order.status !== "problem";

  return (
    <div className="plaza-card mx-auto max-w-2xl overflow-hidden p-0">
      {showDeliveryArt ? (
        <div className="relative aspect-[16/9] w-full">
          <Image
            src={ORDER_DELIVERED_ART}
            alt="A sealed parcel delivered to the plaza"
            fill
            priority
            sizes="(max-width: 768px) 100vw, 42rem"
            className="object-cover"
          />
        </div>
      ) : null}
      <div className="p-8">
        <p className="kicker">Order</p>
        <h1 className="mt-2 font-display text-4xl">{message.title}</h1>
        <p className="mt-3 text-[#3d5158]">{message.body}</p>
        <p className="mt-6 text-sm text-[#5c6d73]">
          Order <span className="font-semibold text-[#14242b]">{order.id}</span>
        </p>
        <p className="mt-1 text-sm">
          Delivering to <span className="font-semibold">{order.username}</span> · {format(order.totalCents)}
        </p>
        <ul className="mt-4 grid gap-2 text-sm">
          {order.items.map((item) => (
            <li key={item.name} className="flex justify-between gap-4">
              <span>
                {item.name} × {item.quantity}
              </span>
              <span>{format(item.lineCents)}</span>
            </li>
          ))}
        </ul>
        <Link href="/support" className="btn btn-ghost mt-6">
          Delivery help
        </Link>
      </div>
    </div>
  );
}

function describe(order: OrderView) {
  if (order.status === "pending") {
    return {
      title: "Confirming payment",
      body: "This order is not delivered until the payment is confirmed. If it stays here, the card webhook has not reached the store yet.",
    };
  }
  if (order.status === "problem" || order.delivery.failed > 0) {
    return {
      title: "Payment received, delivery needs a look",
      body: "The charge went through, and at least one server command did not finish. Contact support with this order id.",
    };
  }
  if (order.delivery.waitingOnline > 0 && order.delivery.waiting === 0) {
    return {
      title: "Almost there",
      body: `${order.username} needs to be online for the crate keys. Everything else delivers within a minute while the server is up.`,
    };
  }
  if (order.delivery.done > 0 && order.delivery.waiting === 0 && order.delivery.waitingOnline === 0) {
    return {
      title: "Delivered",
      body: `The server ran the commands for ${order.username}. Join and check your rank, balance, or keys.`,
    };
  }
  return {
    title: "Payment confirmed",
    body: "Waiting for the server plugin to pick this up. That usually takes under a minute while the server is online.",
  };
}
