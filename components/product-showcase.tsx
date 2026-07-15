"use client";

import Image from "next/image";
import { Star } from "lucide-react";

type ShowcaseProduct = { image_url: string; name: string };

function ProductPreview({ product, duplicate = false }: { product: ShowcaseProduct; duplicate?: boolean }) {
  return (
    <article className="showcase-product" aria-hidden={duplicate || undefined}>
      <div className="showcase-thumb">
        <Image src={product.image_url} alt={duplicate ? "" : product.name} fill sizes="104px" priority={!duplicate} />
      </div>
      <div className="showcase-product-copy">
        <strong>{product.name}</strong>
        <span>Preview de produto salvo</span>
        <span className="badge available">Disponível</span>
      </div>
    </article>
  );
}

export function ProductShowcase({ products }: { products: ShowcaseProduct[] }) {
  if (products.length === 0) {
    return (
      <div className="showcase showcase-empty">
        <Star aria-hidden="true" size={52} strokeWidth={1.5} />
        <span>Seus desejos vão aparecer aqui</span>
      </div>
    );
  }

  const items = products.length === 1 ? [...products, ...products, ...products] : products;

  return (
    <div className="showcase" aria-label="Exemplos de produtos em uma wishlist">
      <div className="showcase-track">
        <div className="showcase-set">
          {items.map((product, index) => <ProductPreview product={product} key={`first-${index}`} />)}
        </div>
        <div className="showcase-set" aria-hidden="true">
          {items.map((product, index) => <ProductPreview product={product} duplicate key={`second-${index}`} />)}
        </div>
      </div>
    </div>
  );
}
