import { ProductCard } from "@/components/product-card";
import { RankOrbitInspector } from "@/components/rank-orbit-inspector";
import { Reveal } from "@/components/reveal";
import { ShopDock } from "@/components/shop-dock";
import { LANE_ART } from "@/lib/art";
import { CATEGORIES, getCategory, productsIn, type CategoryId } from "@/lib/catalog";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return CATEGORIES.map((category) => ({ category: category.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  const found = getCategory(category);
  return { title: found?.title ?? "Store" };
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category: categoryId } = await params;
  const category = getCategory(categoryId);
  if (!category) notFound();
  const products = productsIn(category.id as CategoryId);
  const art = LANE_ART[category.id];

  return (
    <div>
      <div className="border-b border-[#12343c]/8 bg-[#fff9f0]/85">
        <ShopDock />
      </div>
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid items-end gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="kicker">Store</p>
            <h1 className="mt-2 font-display text-5xl">{category.title}</h1>
            <p className="mt-3 max-w-2xl text-[#3d5158]">{category.lede}</p>
          </div>
          <div className="relative aspect-[16/10] overflow-hidden rounded-[1.6rem] border border-[#12343c]/10 shadow-[0_18px_40px_rgba(18,52,60,0.06)]">
            <Image src={art.src} alt={art.alt} fill priority sizes="(max-width: 1024px) 90vw, 420px" className="object-cover" />
          </div>
        </div>
        {category.id === "ranks" ? (
          <div className="mt-8">
            <RankOrbitInspector />
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product, index) => (
              <Reveal key={product.id} delay={index * 0.04}>
                <ProductCard product={product} />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
