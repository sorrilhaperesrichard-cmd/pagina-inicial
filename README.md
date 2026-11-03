# pagina-inicial

Página inicial gratuita e open source, alternativa ao start.me.
Roda no Cloudflare Pages (plano grátis).

## Estrutura

- `public/` — o site (HTML, CSS, JS estáticos)
- `functions/` — backend (Cloudflare Pages Functions)

## Deploy no Cloudflare Pages

- Framework preset: **None**
- Build command: *(vazio)*
- Build output directory: `public`

## Testar localmente

```bash
npx wrangler pages dev public
```

Abre em http://localhost:8788

## Licença

MIT
