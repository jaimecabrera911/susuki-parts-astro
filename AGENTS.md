## Development

Always base the visual and UX design on `DESIGN.md` when building or modifying UI.

No component may contain hardcoded values, fallbacks, or magic strings (e.g. inline prices, names, statuses, defaults, IDs). All such data must come from the database. If the data is not available from the database, the UI must render the real stored value or an empty/neutral state — never a fabricated fallback.

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Component IDs

Every singleton React component in `src/components/` (rendered at most once per view) must have a kebab-case `id` on its root element, derived from the filename (`ProductDetailModal.tsx` → `product-detail-modal`). This lets the AI (or a browser tool) locate a component by id: `document.getElementById('cart-drawer')` or open the matching source file.

Rules:

- Singleton components: `id` on the root element, always in kebab-case.
- Components rendered in lists/maps (e.g. `ProductCard`, `UserAvatar`, `ProductImageFallback`, skeleton cards): no static `id` (it would duplicate in the DOM). Identify them via their singleton container instead.
- When a component returns a fragment (`<>`), wrap it in a single root `<div>` carrying the id.
- Multi-branch returns (e.g. empty/loading/success states): every branch's root gets the same id.
- Components without a visible root (logic-only wrappers) are exempt.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
