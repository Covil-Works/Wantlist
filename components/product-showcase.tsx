"use client";

import Image from "next/image";
import { Star } from "lucide-react";
import { useEffect, useState } from "react";

type ShowcaseImage = { image_url: string; name: string };

export function ProductShowcase({ images }: { images: ShowcaseImage[] }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (images.length < 2) return;
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % images.length);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [images.length]);

  return (
    <div className="showcase" aria-label="Itens de wishlists públicas">
      {images.length === 0 ? (
        <div className="showcase-empty">
          <Star aria-hidden="true" size={52} strokeWidth={1.5} />
          <span>Seus desejos vão aparecer aqui</span>
        </div>
      ) : (
        <>
          <div className="showcase-images">
            {images.map((item, index) => (
              <Image key={`${item.image_url}-${index}`} className={`showcase-image${index === active ? " active" : ""}`} src={item.image_url} alt={item.name} fill sizes="(max-width: 760px) calc(100vw - 32px), 430px" priority={index === 0} unoptimized />
            ))}
          </div>
          {images.length > 1 && <div className="showcase-dots" aria-hidden="true">{images.map((_, index) => <span className={index === active ? "active" : ""} key={index} />)}</div>}
        </>
      )}
    </div>
  );
}
