# Jewelry site with AI features

A Next.js site for an independent jewelry brand, with four AI features built on the Claude API.

| Page | Feature |
|---|---|
| `/advisor` | AI Jewelry Advisor: chat about occasion, budget and style, get picks from the real catalog |
| `/gift` | Gift Finder: a few questions about the recipient, get gift picks and card messages |
| `/custom` | Custom Design: describe an idea, get a concept sketch and a design brief to email the jeweler |
| `/help` | Customer Help: answers shipping, returns and care questions from `lib/knowledge.ts` only (RAG), with sources |
| `/studio` | Studio tool for the owner: upload a product photo, get product copy, SEO text and tags |

Each product page has a **Buy now** button that opens Stripe Checkout in test mode (see below).

The AI only recommends products from `lib/products.ts`, and unknown ids are filtered out on the server.

## Run locally

```bash
npm install
cp .env.example .env.local   # then add your ANTHROPIC_API_KEY
npm run dev
```

## Add your products

Edit `lib/products.ts`. Put photos in `public/products/` and set `image: "/products/your-photo.jpg"` on each product. Until then, each product shows a simple drawn placeholder.

## Checkout (Stripe test mode)

`/api/checkout` creates a Stripe Checkout session for one product, with the price taken from `lib/products.ts` on the server. After paying, Stripe redirects to `/checkout/success`, which looks the session up and shows the order. Orders appear in the Stripe dashboard under Payments.

Set `STRIPE_SECRET_KEY` to a **test** key (`sk_test_...`); live keys are refused, so no real card can be charged. Pay with `4242 4242 4242 4242`, any future expiry date and any CVC. Shipping countries and the flat rate are in `lib/stripe.ts`.

## Deploy

1. Import this repository on [Vercel](https://vercel.com/new).
2. Add the environment variables from `.env.example` in the Vercel project settings.
3. In Vercel, add your domain under Settings → Domains, then add the DNS records Vercel shows in your registrar (Spaceship).
