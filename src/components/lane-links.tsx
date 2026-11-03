"use client";

import { Reveal } from "@/components/reveal";
import { CATEGORIES } from "@/lib/catalog";
import { LANE_ART } from "@/lib/art";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function LaneLinks() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.from(".lane-art", {
        opacity: 0,
        y: 28,
        stagger: 0.1,
        duration: 0.75,
        ease: "power3.out",
        scrollTrigger: {
          trigger: root.current,
          start: "top 82%",
        },
      });
    },
    { scope: root },
  );

  return (
    <div ref={root} className="grid gap-4 lg:grid-cols-3">
      {CATEGORIES.map((category, index) => {
        const art = LANE_ART[category.id];
        return (
          <Reveal key={category.id} delay={index * 0.06}>
            <Link href={category.href} className="lane-card lane-card-art">
              <div className="lane-card-copy">
                <span className="lane-card-index">0{index + 1}</span>
                <span className="min-w-0">
                  <span className="block font-display text-3xl">{category.title}</span>
                  <span className="mt-2 block text-sm leading-6 text-[#3d5158]">{category.lede}</span>
                </span>
              </div>
              <span className="lane-art">
                <Image
                  src={art.src}
                  alt={art.alt}
                  fill
                  sizes="(max-width: 1024px) 90vw, 360px"
                  className="object-cover"
                />
              </span>
            </Link>
          </Reveal>
        );
      })}
    </div>
  );
}
