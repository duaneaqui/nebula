"use client";

import { CopyAddress } from "@/components/copy-address";
import { PriceTag } from "@/components/price-tag";
import { PAID_RANKS, RANK_STYLE, productsIn, rankProduct } from "@/lib/catalog";
import type { ServerStatus } from "@/lib/status";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { DescentScene } from "./descent-scene";

gsap.registerPlugin(useGSAP, ScrollTrigger);

type Stop = {
  id: string;
  code: string;
  name: string;
  art: string;
  accent: string;
};

const STOPS: Stop[] = [
  { id: "launch", code: "00", name: "Launch pad", art: "/art/descent/hero-island.webp", accent: "#5eead4" },
  { id: "ranks", code: "01", name: "Rank spire", art: "/art/descent/ranks-island.webp", accent: "#a78bfa" },
  { id: "stardust", code: "02", name: "Stardust reef", art: "/art/descent/stardust-crystals.webp", accent: "#2dd4bf" },
  { id: "keys", code: "03", name: "Crate vault", art: "/art/descent/keys-crate.webp", accent: "#ffa53c" },
  { id: "gate", code: "04", name: "Delivery gate", art: "/art/descent/portal-island.webp", accent: "#f472b6" },
];

const LAST = STOPS.length - 1;

function visibility(stop: number, index: number) {
  const distance = Math.abs(stop - index);
  const t = Math.min(1, Math.max(0, (distance - 0.14) / 0.3));
  return 1 - t * t * (3 - 2 * t);
}

export function NebulaDescent({ status }: { status: ServerStatus }) {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const canvasHost = useRef<HTMLDivElement>(null);
  const panels = useRef<(HTMLElement | null)[]>([]);
  const coords = useRef<HTMLSpanElement>(null);
  const cue = useRef<HTMLDivElement>(null);
  const scene = useRef<DescentScene | null>(null);
  const activeRef = useRef(0);
  const [active, setActive] = useState(0);
  const [fallback, setFallback] = useState(false);

  const applyStop = (stop: number, x = 0, y = 0, z = 0) => {
    panels.current.forEach((panel, index) => {
      if (!panel) return;
      const vis = visibility(stop, index);
      const direction = index > stop ? 1 : -1;
      panel.style.opacity = vis.toFixed(3);
      panel.style.transform = `translate3d(0, ${((1 - vis) * 36 * direction).toFixed(1)}px, 0) scale(${(0.95 + vis * 0.05).toFixed(3)})`;
      panel.style.filter = vis < 0.98 ? `blur(${((1 - vis) * 6).toFixed(1)}px)` : "none";
      const shown = vis > 0.55;
      panel.style.pointerEvents = shown ? "auto" : "none";
      panel.style.visibility = vis < 0.01 ? "hidden" : "visible";
      panel.toggleAttribute("inert", !shown);
    });

    const rounded = Math.round(stop);
    if (rounded !== activeRef.current) {
      activeRef.current = rounded;
      setActive(rounded);
    }
    const progress = stop / LAST;
    stage.current?.style.setProperty("--descent-progress", progress.toFixed(4));
    if (cue.current) cue.current.style.opacity = String(Math.max(0, 1 - stop * 4));
    if (coords.current) {
      coords.current.textContent = `X ${x.toFixed(2)}  Y ${y.toFixed(2)}  Z ${z.toFixed(2)}`;
    }
  };

  useEffect(() => {
    const host = canvasHost.current;
    if (!host) return;
    let disposed = false;
    let instance: DescentScene | null = null;

    void import("./descent-scene")
      .then(({ createDescentScene }) => {
        if (disposed) return;
        try {
          instance = createDescentScene(
            host,
            STOPS.map((stop) => ({ art: stop.art, accent: stop.accent })),
          );
        } catch {
          setFallback(true);
          return;
        }
        instance.onFrame(({ stop, camera }) => applyStop(stop, camera.x, camera.y, camera.z));
        scene.current = instance;
        const trigger = ScrollTrigger.getById("nebula-descent");
        if (trigger) instance.setProgress(trigger.progress);
      })
      .catch(() => setFallback(true));

    const observer = new IntersectionObserver(([entry]) => {
      scene.current?.setActive(entry.isIntersecting);
    });
    if (root.current) observer.observe(root.current);

    return () => {
      disposed = true;
      observer.disconnect();
      instance?.dispose();
      scene.current = null;
    };
  }, []);

  useGSAP(
    () => {
      ScrollTrigger.create({
        id: "nebula-descent",
        trigger: root.current,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          if (scene.current) scene.current.setProgress(self.progress);
          else applyStop(self.progress * LAST);
        },
      });
      applyStop(0);

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.from(".descent-intro", { y: 40, opacity: 0, duration: 1.1, ease: "power3.out", stagger: 0.12, delay: 0.2 });
    },
    { scope: root },
  );

  const onPointer = (event: React.PointerEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    scene.current?.setPointer(
      ((event.clientX - rect.left) / rect.width - 0.5) * 2,
      ((event.clientY - rect.top) / rect.height - 0.5) * 2,
    );
  };

  const jumpTo = (index: number) => {
    const section = root.current;
    if (!section) return;
    const travel = section.offsetHeight - window.innerHeight;
    const top = section.getBoundingClientRect().top + window.scrollY + (travel * index) / LAST;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top, behavior: smooth ? "smooth" : "auto" });
  };

  const stardust = productsIn("stardust").slice(0, 4);
  const keys = productsIn("keys");
  const current = STOPS[active] ?? STOPS[0];

  return (
    <section
      ref={root}
      className="descent"
      style={{ height: `${STOPS.length * 100 + 60}svh` }}
      aria-label="NebulaCraft store tour"
    >
      <div ref={stage} className="descent-stage" onPointerMove={onPointer}>
        <div ref={canvasHost} className="descent-canvas" aria-hidden="true" />
        {fallback ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={current.art}
            alt=""
            className={`descent-fallback-art ${active % 2 === 0 ? "is-right" : "is-left"}`}
          />
        ) : null}
        <div className="descent-vignette" aria-hidden="true" />

        <div className="descent-chip">
          <span className="descent-chip-dot" style={{ background: current.accent }} />
          <span className="font-bold">WP {current.code}</span>
          <span className="opacity-60">/ {STOPS[LAST].code}</span>
          <span className="hidden sm:inline">· {current.name}</span>
        </div>

        <div className="descent-coords" aria-hidden="true">
          <span ref={coords}>X 0.00  Y 0.00  Z 0.00</span>
        </div>

        <nav className="descent-rail" aria-label="Tour waypoints">
          <span className="descent-rail-track" aria-hidden="true">
            <span className="descent-rail-meter" />
          </span>
          {STOPS.map((stop, index) => (
            <button
              key={stop.id}
              type="button"
              className={`descent-rail-dot ${index === active ? "is-active" : ""}`}
              style={{ "--accent": stop.accent } as React.CSSProperties}
              aria-label={`Go to ${stop.name}`}
              aria-current={index === active ? "step" : undefined}
              onClick={() => jumpTo(index)}
            >
              <span className="descent-rail-label">{stop.name}</span>
            </button>
          ))}
        </nav>

        <div ref={cue} className="descent-cue" aria-hidden="true">
          <span>Scroll to descend</span>
          <span className="descent-cue-line" />
        </div>

        <Panel index={0} side="left" stop={STOPS[0]} refs={panels}>
          <p className="descent-intro font-display text-[clamp(2.4rem,min(5.2vw,9svh),4.4rem)] leading-[0.9] tracking-[-0.04em] text-[#f4fbf9]">
            NebulaCraft
          </p>
          <h1 className="descent-intro mt-4 font-display text-[clamp(1.4rem,3vw,2.2rem)] leading-[1.08] text-[#d9f5f0]">
            Buy your orbit. Open the crates. Claim more sky.
          </h1>
          <p className="descent-intro descent-intro-copy mt-4 text-sm leading-7 text-[#c6e4df] sm:text-base">
            The plaza store for ranks, Stardust, and paid crate keys. Pay once — the server hands it to your Minecraft
            name on Java or Bedrock.
          </p>
          <div className="descent-intro mt-5">
            <LaunchStatus status={status} />
          </div>
          <div className="descent-intro mt-6 flex flex-wrap gap-3">
            <button type="button" className="btn btn-orange" onClick={() => jumpTo(1)}>
              Start the descent
            </button>
            <Link href="/store/ranks" className="btn btn-ghost border-white/25 text-[#f4fbf9]">
              Skip to ranks
            </Link>
          </div>
        </Panel>

        <Panel index={1} side="right" stop={STOPS[1]} refs={panels}>
          <h2 className="descent-title">Five pillars. One climb.</h2>
          <p className="descent-copy">
            Every pillar is a paid rank. A higher rank replaces the one below it, and your free Ascension track keeps
            going. Pick a pillar to open its dossier.
          </p>
          <ul className="mt-5 grid gap-2">
            {PAID_RANKS.map((rank, index) => {
              const style = RANK_STYLE[rank];
              const product = rankProduct(rank);
              if (!product) return null;
              return (
                <li key={rank}>
                  <Link href={`/store/ranks#${rank}`} className="descent-row group">
                    <span className="descent-gem" style={{ background: style.color, boxShadow: `0 0 18px ${style.color}` }} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[10px] font-bold tracking-[0.18em] text-[#7fdad2] uppercase">
                        Pillar {index + 1}
                      </span>
                      <span className="block font-display text-lg leading-tight text-[#f4fbf9]">
                        {style.mark ? `${style.mark} ` : ""}
                        {style.label}
                      </span>
                    </span>
                    <span className="text-[#e8f7f3]">
                      <PriceTag priceCents={product.priceCents} compareAtCents={product.compareAtCents} size="sm" />
                    </span>
                    <span className="descent-row-arrow" aria-hidden="true">
                      →
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/store/ranks" className="btn btn-orange">
              Open rank dossiers
            </Link>
            <Link href="/ranks" className="btn btn-ghost border-white/25 text-[#f4fbf9]">
              Compare board
            </Link>
          </div>
        </Panel>

        <Panel index={2} side="left" stop={STOPS[2]} refs={panels}>
          <h2 className="descent-title">Mine the shine.</h2>
          <p className="descent-copy">
            Stardust is the premium currency. Spend it on cosmetics, the exchange, and extra land chunks in the in-game
            /claimshop. Bigger packs carry bonus Stardust.
          </p>
          <ul className="mt-5 grid grid-cols-2 gap-2">
            {stardust.map((product) => (
              <li key={product.id}>
                <Link href={`/product/${product.id}`} className="descent-tile">
                  <span className="block font-display text-2xl leading-none text-[#f4fbf9]">
                    {product.delivery.type === "stardust" ? product.delivery.amount.toLocaleString("en-US") : product.name}
                  </span>
                  <span className="mt-1 block text-[10px] font-bold tracking-[0.18em] text-[#5eead4] uppercase">
                    Stardust
                  </span>
                  <span className="mt-2 block text-[#e8f7f3]">
                    <PriceTag priceCents={product.priceCents} compareAtCents={product.compareAtCents} size="sm" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-5">
            <Link href="/store/stardust" className="btn btn-orange">
              All Stardust packs
            </Link>
          </div>
        </Panel>

        <Panel index={3} side="right" stop={STOPS[3]} refs={panels}>
          <h2 className="descent-title">The vault opens with keys.</h2>
          <p className="descent-copy">
            Paid keys for the crates at /warp crates — Comet up to Empyrean — plus a Mystery Key Bundle with equal odds
            at Ascendant. Keys wait until you are online, then land straight in your inventory.
          </p>
          <ul className="mt-5 grid gap-2">
            {keys.map((product) => (
              <li key={product.id}>
                <Link href={`/product/${product.id}`} className="descent-row">
                  <span className="descent-gem is-key" style={{ background: product.accent, boxShadow: `0 0 16px ${product.accent}` }} />
                  <span className="min-w-0 flex-1 font-display text-lg leading-tight text-[#f4fbf9]">{product.name}</span>
                  <span className="text-[#e8f7f3]">
                    <PriceTag priceCents={product.priceCents} compareAtCents={product.compareAtCents} size="sm" />
                  </span>
                  <span className="descent-row-arrow" aria-hidden="true">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-5">
            <Link href="/store/keys" className="btn btn-orange">
              Browse crate keys
            </Link>
          </div>
        </Panel>

        <Panel index={4} side="left" stop={STOPS[4]} refs={panels}>
          <h2 className="descent-title">Pay once. Land in game.</h2>
          <ol className="mt-5 grid gap-3">
            {[
              ["Type your name", "Premium, cracked, or Bedrock — we verify the name before you pay."],
              ["Check out", "PayPal or QR Ph. The order is queued the moment payment clears."],
              ["Walk through the gate", "The server plugin picks it up within a minute. Ranks and Stardust arrive even offline."],
            ].map(([title, body], index) => (
              <li key={title} className="descent-step">
                <span className="descent-step-index">{index + 1}</span>
                <span>
                  <span className="block font-semibold text-[#f4fbf9]">{title}</span>
                  <span className="block text-sm leading-6 text-[#c6e4df]">{body}</span>
                </span>
              </li>
            ))}
          </ol>
          {status.address ? (
            <div className="mt-5 inline-flex rounded-2xl border border-white/15 bg-[#0d2429]/60 px-4 py-2">
              <CopyAddress address={status.address} light />
            </div>
          ) : null}
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/cart" className="btn btn-orange">
              Open the cart
            </Link>
            <Link href="/support" className="btn btn-ghost border-white/25 text-[#f4fbf9]">
              Need help?
            </Link>
          </div>
        </Panel>
      </div>
    </section>
  );
}

function LaunchStatus({ status }: { status: ServerStatus }) {
  const dot =
    status.state === "online" ? "#2dd4bf" : status.state === "offline" ? "#ff7a32" : "#9eb0ab";
  const label =
    status.state === "online"
      ? `${status.online} online`
      : status.state === "offline"
        ? "Server offline"
        : status.state === "unknown"
          ? "Status unavailable"
          : status.address
            ? "Checking status"
            : "Play address coming soon";

  return (
    <div className="descent-status">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 text-sm text-[#e8f7f3]">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: dot, boxShadow: `0 0 10px ${dot}` }} />
          {label}
        </span>
        <span className="rounded-full border border-white/15 px-2.5 py-1 text-[10px] font-bold tracking-wide text-[#9ee6dc] uppercase">
          Java & Bedrock
        </span>
      </div>
      {status.address ? (
        <div className="mt-2 border-t border-white/10 pt-2 text-sm">
          <CopyAddress address={status.address} light />
        </div>
      ) : null}
    </div>
  );
}

function Panel({
  index,
  side,
  stop,
  refs,
  children,
}: {
  index: number;
  side: "left" | "right";
  stop: Stop;
  refs: React.RefObject<(HTMLElement | null)[]>;
  children: ReactNode;
}) {
  return (
    <article
      ref={(element) => {
        refs.current[index] = element;
      }}
      className={`descent-panel is-${side}`}
      style={{ "--accent": stop.accent, opacity: index === 0 ? 1 : 0 } as React.CSSProperties}
      aria-label={stop.name}
    >
      <header className="descent-panel-head">
        <span className="descent-panel-node" aria-hidden="true">
          {stop.code}
        </span>
        <span>
          <span className="block">Waypoint {stop.code} // {stop.name}</span>
          <span className="block opacity-60">NebulaCraft · plaza store</span>
        </span>
      </header>
      <div className="descent-panel-body">{children}</div>
    </article>
  );
}
