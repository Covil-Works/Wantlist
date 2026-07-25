# Wantlist

Plataforma MVP de wishlists universais feita com Next.js, Firebase Authentication e Neon PostgreSQL.

## Rodando localmente

1. Instale as dependências:

```bash
npm install
```

2. Copie `.env.example` para `.env.local` e preencha:

- `WANTLIST_DATABASE_URL` com a conexão do Neon.
- variáveis `NEXT_PUBLIC_FIREBASE_*` do Firebase client.
- variáveis `FIREBASE_*` do Firebase Admin.

3. Crie as tabelas no Neon executando `database/schema.sql`.

4. Inicie o app:

```bash
npm run dev
```

## Escopo implementado

- Cadastro, login, logout e recuperação de senha via Firebase.
- Onboarding com nome de exibição e nome de usuário único.
- Uma wishlist por usuário, com código público aleatório.
- Visibilidades pública, convidados e privada validadas no servidor.
- Cadastro manual de itens e tentativa de preenchimento por Open Graph no servidor.
- Proteções básicas de URL contra localhost e IPs privados.
- Reservas atômicas por item usando chave única no banco.
- Privacidade da reserva: o cliente recebe apenas estado reservado ou reservado por você.
- Seguidores de listas públicas.
- Convites por link com token armazenado como hash.
- Painel, página pública da wishlist, configurações, perfil e aceite de convite.

## Deploy

O projeto foi preparado para Vercel. As credenciais do Neon e Firebase Admin devem ficar apenas nas variáveis de ambiente do projeto na Vercel.
