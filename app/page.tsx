import Link from "next/link";
import { ProductShowcase } from "@/components/product-showcase";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const images = await sql`
    select i.image_url, i.name from items i
    join wishlists w on w.id = i.wishlist_id
    where i.image_url is not null and i.image_url <> '' and w.visibility = 'public'
    order by i.updated_at desc limit 8
  `;

  return (
    <main className="page">
      <section className="hero">
        <div>
          <h1>Uma lista de desejos para qualquer loja.</h1>
          <p className="lead">
            Reúna produtos de sites diferentes, compartilhe por link e deixe amigos reservarem itens sem revelar quem reservou.
          </p>
          <div className="row">
            <Link className="button primary" href="/cadastro">Criar conta</Link>
            <Link className="button" href="/login">Entrar</Link>
          </div>
        </div>
        <ProductShowcase images={images as { image_url: string; name: string }[]} />
      </section>
    </main>
  );
}
