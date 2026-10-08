# Jewelry site with AI features

A Next.js site for an independent jewelry brand, with four AI features built on the Claude API.

| Page | Feature |
|---|---|
| `/advisor` | AI Jewelry Advisor: chat about occasion, budget and style, get picks from the real catalog |
| `/gift` | Gift Finder: a few questions about the recipient, get gift picks and card messages |
| `/custom` | Custom Design: describe an idea, get a concept sketch and a design brief to email the jeweler |
| `/help` | Customer Help: answers shipping, returns and care questions from `lib/knowledge.ts` only (RAG), with sources |
| `/studio` | Studio tool for the owner: upload a product photo, get product copy, SEO text and tags |

The AI only recommends products from `lib/products.ts`, and unknown ids are filtered out on the server.

## Run locally

```bash
npm install
cp .env.example .env.local   # then add your ANTHROPIC_API_KEY
npm run dev
```

## Add your products

Edit `lib/products.ts`. Put photos in `public/products/` and set `image: "/products/your-photo.jpg"` on each product. Until then, each product shows a simple drawn placeholder.

## Deploy

1. Import this repository on [Vercel](https://vercel.com/new).
2. Add the environment variables from `.env.example` in the Vercel project settings.
3. In Vercel, add your domain under Settings → Domains, then add the DNS records Vercel shows in your registrar (Spaceship).

## Catalog MCP server

`/api/mcp` is a read-only [MCP](https://modelcontextprotocol.io) server with two tools, `search_products` and `get_product`, so AI apps can look up the catalog. It is off until `MCP_API_KEY` is set in Vercel (generate one with `openssl rand -hex 32`). To connect from Claude Code:

```bash
claude mcp add --transport http hayaurie https://YOUR-DOMAIN/api/mcp --header "Authorization: Bearer YOUR_MCP_API_KEY"
```

Then ask Claude, for example, "Which Hayaurie earrings are under $30?".
