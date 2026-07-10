# Wantlist

Plataforma MVP de wishlists universais feita com Next.js, Firebase Authentication e Neon PostgreSQL.

## Rodando localmente

1. Instale as dependencias:

```bash
npm install
```

2. Copie `.env.example` para `.env.local` e preencha:

- `WANTLIST_DATABASE_URL` com a conexao do Neon.
- variaveis `NEXT_PUBLIC_FIREBASE_*` do Firebase client.
- variaveis `FIREBASE_*` do Firebase Admin.

3. Crie as tabelas no Neon executando `database/schema.sql`.

4. Inicie o app:

```bash
npm run dev
```

## Escopo implementado

- Cadastro, login, logout e recuperacao de senha via Firebase.
- Onboarding com nome de exibicao e nome de usuario unico.
- Uma wishlist por usuario, com codigo publico aleatorio.
- Visibilidades publica, convidados e privada validadas no servidor.
- Cadastro manual de itens e tentativa de preenchimento por Open Graph no servidor.
- Protecoes basicas de URL contra localhost e IPs privados.
- Reservas atomicas por item usando chave unica no banco.
- Privacidade da reserva: o cliente recebe apenas estado reservado ou reservado por voce.
- Seguidores de listas publicas.
- Convites por link com token armazenado como hash.
- Painel, pagina publica da wishlist, configuracoes, perfil e aceite de convite.

## Deploy

O projeto foi preparado para Vercel. As credenciais do Neon e Firebase Admin devem ficar apenas nas variaveis de ambiente do projeto na Vercel.
