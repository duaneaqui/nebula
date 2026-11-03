"use client";

import { Reveal } from "@/components/reveal";

const STEPS = [
  {
    n: "01",
    title: "Name the player",
    body: "Java names get a Mojang check. Bedrock names keep the Floodgate dot, like .Alex.",
  },
  {
    n: "02",
    title: "Pay for the package",
    body: "Checkout locks the cart to that username. Pay with QR Ph or PayPal — the store never sees your PIN.",
  },
  {
    n: "03",
    title: "The plaza delivers",
    body: "NebulaStore on the Paper server pulls the paid commands and runs them. Keys wait for online.",
  },
];

export function DeliveryPath() {
  return (
    <section className="relative overflow-hidden rounded-[2rem] bg-[#12343c] px-6 py-10 text-[#f4fbf9] sm:px-10">
      <div className="pointer-events-none absolute -right-10 top-0 h-48 w-48 rounded-full bg-[#2dd4bf]/20 blur-3xl" />
      <div className="pointer-events-none absolute -left-8 bottom-0 h-40 w-40 rounded-full bg-[#f472b6]/20 blur-3xl" />
      <p className="kicker text-[#5eead4]">How it lands</p>
      <h2 className="mt-2 max-w-xl font-display text-4xl">From checkout to chat prefix in three beats</h2>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {STEPS.map((step, index) => (
          <Reveal key={step.n} delay={index * 0.08}>
            <article className="rounded-[1.4rem] border border-white/10 bg-white/5 p-5 backdrop-blur">
              <p className="font-display text-3xl text-[#5eead4]">{step.n}</p>
              <h3 className="mt-3 font-display text-2xl">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#d5e4e2]">{step.body}</p>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
