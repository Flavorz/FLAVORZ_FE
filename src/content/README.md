# Content

All copy, pricing and imagery metadata for the Flavorz screens. No component
hardcodes content — everything is read through `src/lib/data/`.

## Files

| File | Holds |
| --- | --- |
| `site.json` | Brand, nav, search placeholder, languages, footer |
| `home.json` | Ticker, shopper tier, promos, reels, videos, leaderboards |
| `products.json` | Products, prices, packs, stock, chips |
| `makers.json` | Makers, bios, ratings, counts |
| `cart.json` | Cart lines, order summary, add-ons |

Products and the cart reference makers by `makerId`, and the home page
references both by id. A dangling reference fails `tests/data-source.test.ts`
rather than rendering a blank card.

## Switching to a real API

Nothing in the screens changes. Set two environment variables:

```bash
PUBLIC_CONTENT_SOURCE=api
PUBLIC_API_BASE_URL=https://api.theflavorz.com/v1
```

The backend must return the shapes in `src/lib/data/types.ts` from:

```
GET /site
GET /home
GET /cart
GET /makers
GET /makers/:id
GET /products
GET /products/:slug      → product with its maker attached
GET /products?ids=a,b,c
```

If the backend's shape differs, map it in `src/lib/data/api.ts` — not in
components. `tests/data-source.test.ts` defines the contract both sources must
satisfy; point it at the API implementation to verify a new backend.

## Adding content

Adding a product to `products.json` generates its page automatically — routes
come from the data source, not from files.
