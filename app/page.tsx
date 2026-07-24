import { HomeActions } from "@/components/home-actions";
import { ProductShowcase } from "@/components/product-showcase";

const mockProducts = [
  { image_url: "/mock-products/air-fryer-mondial.png", name: "Air Fryer Mondial Family" },
  { image_url: "/mock-products/blush-nars.png", name: "Blush NARS Orgasm" },
  { image_url: "/mock-products/controle-xbox.png", name: "Controle Xbox Wireless" },
  { image_url: "/mock-products/batom-liquido-roxo.png", name: "Batom líquido roxo" },
  { image_url: "/mock-products/fone-jbl.png", name: "Fone Bluetooth JBL" },
  { image_url: "/mock-products/mop-giratorio.png", name: "Mop giratório 360" },
  { image_url: "/mock-products/panela-pressao.png", name: "Panela de pressão" },
  { image_url: "/mock-products/pote-hermetico.png", name: "Pote hermético de vidro" },
];

export default async function HomePage() {
  return (
    <main className="page">
      <section className="hero">
        <div>
          <h1>Uma lista de desejos para <span className="hero-highlight">qualquer loja</span>.</h1>
          <p className="lead">
            Reúna produtos de sites diferentes, compartilhe por link e deixe amigos reservarem itens sem revelar quem reservou.
          </p>
          <HomeActions />
        </div>
        <ProductShowcase products={mockProducts} />
      </section>
    </main>
  );
}
