import Link from "next/link";

export default function HomePage() {
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
        <div className="panel stack">
          <div className="spread"><strong>Minha wishlist</strong><span className="badge">publica</span></div>
          <div className="item-card">
            <div className="item-image" />
            <div className="item-body">
              <strong>Produto salvo por URL</strong>
              <span className="muted">Loja detectada automaticamente</span>
              <span className="badge available">Disponivel</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
