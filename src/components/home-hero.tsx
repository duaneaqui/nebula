"use client";

import { CosmicField } from "@/components/cosmic-field";
import { HERO_ART } from "@/lib/art";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function HomeHero() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });
      timeline
        .from(".hero-plate", { scale: 1.12, opacity: 0.35, duration: 1.35, ease: "power2.out" }, 0)
        .from(".hero-brand", { y: 28, opacity: 0, duration: 0.8 }, 0.15)
        .from(".hero-line", { y: 36, opacity: 0, duration: 0.85 }, "-=0.45")
        .from(".hero-copy", { y: 24, opacity: 0, duration: 0.7 }, "-=0.5")
        .from(".hero-actions", { y: 18, opacity: 0, duration: 0.65 }, "-=0.45");

      gsap.to(".hero-plate", {
        yPercent: 12,
        ease: "none",
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} className="hero-shell relative isolate overflow-hidden">
      <div className="hero-plate absolute inset-0 -z-20 scale-110">
        <Image
          src={HERO_ART}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[68%_42%]"
        />
      </div>
      <CosmicField className="absolute inset-0 -z-10 opacity-45" />
      <div className="hero-veil absolute inset-0 -z-10" />
      <div className="mx-auto flex min-h-[92vh] max-w-6xl flex-col justify-end px-4 pb-14 pt-24 sm:pb-16 lg:justify-center lg:pb-20">
        <p className="hero-brand font-display text-[clamp(3.4rem,12vw,8.5rem)] leading-[0.86] tracking-[-0.04em] text-[#f4fbf9]">
          NebulaCraft
        </p>
        <h1 className="hero-line mt-5 max-w-3xl font-display text-[clamp(1.8rem,4.4vw,3.4rem)] leading-[1.05] text-[#d9f5f0]">
          Buy your orbit. Open the crates. Claim more sky.
        </h1>
        <p className="hero-copy mt-5 max-w-xl text-base leading-7 text-[#c6e4df] sm:text-lg sm:leading-8">
          The plaza store for ranks, Stardust, and paid crate keys. Open for Java and Bedrock. Pay once — the server
          hands it to your Minecraft name.
        </p>
        <div className="hero-actions mt-8 flex flex-wrap gap-3">
          <Link href="/store/ranks" className="btn btn-orange">
            Climb the ranks
          </Link>
          <Link href="/store/stardust" className="btn btn-ghost border-white/25 text-[#f4fbf9]">
            Grab Stardust
          </Link>
        </div>
      </div>
    </section>
  );
}
