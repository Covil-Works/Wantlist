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

## Coletor de dados de produto

Fluxo resumido:

1. Normaliza e valida a URL recebida.
2. Identifica a loja pelo domínio; links encurtados conhecidos são resolvidos antes da coleta.
3. Quando existe parser da loja, tenta inferir o título pela própria URL.
4. Executa tentativas com `open-graph-scraper` na ordem configurada para a loja.
5. Mescla apenas campos ainda ausentes: `title`, `description`, `imageUrl` e `canonicalUrl`.

O `open-graph-scraper` busca principalmente metadados sociais da página. A normalização prioriza Open Graph, com fallback para Twitter Card, Dublin Core e campos genéricos:

- título: `ogTitle`, `twitterTitle`, `dcTitle`, `title`;
- descrição: `ogDescription`, `twitterDescription`, `dcDescription`, `description`;
- imagem: `ogImage`, `twitterImage`, `image`;
- URL canônica: `ogUrl`, `requestUrl`, `url`.

As variações entre tentativas são os headers enviados na requisição:

- `DEFAULT`: sem headers customizados;
- `BROWSER`: simula navegador Chrome com `accept`, `accept-language` em português e `user-agent` de Chrome;
- `SOCIAL_FACEBOOK`: simula crawler do Facebook;
- `SOCIAL_WHATSAPP`: simula crawler do WhatsApp.

Ordem de tentativas por loja do catálogo:

| Loja | Links encurtados | Parser de título pela URL | Ordem Open Graph |
| --- | --- | --- | --- |
| Amazon | `a.co` | Sim | `DEFAULT` -> `BROWSER` -> `SOCIAL_FACEBOOK` -> `SOCIAL_WHATSAPP` |
| Mercado Livre | `mercadolivre.com`, `meli.to` | Sim | `SOCIAL_FACEBOOK` -> `SOCIAL_WHATSAPP` -> `BROWSER` -> `DEFAULT` |
| Centauro | Não | Sim | `DEFAULT` -> `SOCIAL_WHATSAPP` -> `BROWSER` -> `SOCIAL_FACEBOOK` |
| Shopee | Não | Sim | `BROWSER` -> `DEFAULT` |
| Shein | Não | Sim | `BROWSER` -> `DEFAULT` |
| Magalu | Não | Sim | `BROWSER` -> `DEFAULT` |
| Sephora | Não | Sim | `BROWSER` -> `DEFAULT` |

Para lojas desconhecidas, o fallback genérico usa `BROWSER` -> `DEFAULT`, sem parser específico de título.

## Deploy

O projeto foi preparado para Vercel. As credenciais do Neon e Firebase Admin devem ficar apenas nas variáveis de ambiente do projeto na Vercel.
