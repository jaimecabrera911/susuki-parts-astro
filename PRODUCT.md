# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Suzuki motorcycle owners and mechanics in Spanish-speaking markets who need to find genuine replacement parts with guaranteed fit for their specific motorcycle model, year, and version.

## Product Purpose

An e-commerce platform that eliminates the risk of buying incompatible motorcycle parts by matching parts to the user's exact Suzuki model through a compatibility engine. Users browse a catalog of genuine OEM parts, verify compatibility in real time, view interactive exploded-view schematics, and order with confidence that every part will fit their bike.

## Positioning

Guaranteed compatibility via model/year/version matching. Unlike generic parts catalogs, every part shown is verified against the user's specific motorcycle — the compatibility engine is the core differentiator. Interactive exploded-view diagrams and an AI technical assistant further reduce the chance of ordering the wrong part.

## Operating Context

- Users typically arrive with a specific motorcycle in mind and a maintenance or repair job to complete
- The "garage" workflow: select your motorcycle once, then browse parts pre-filtered to your exact bike
- Parts lookup can start from: browsing categories, searching by OEM number, searching by keyword, or navigating exploded-view diagrams
- WhatsApp integration for direct contact with the store
- Checkout and order history for repeat purchases

## Capabilities and Constraints

- Motorcycle compatibility selector (brand → model → year → version)
- Catalog with category, price, stock, model, and compatibility filters
- Interactive exploded-view schematic diagrams for each motorcycle
- AI-powered technical assistant (Google Gemini API) for part identification and guidance
- Cart, checkout, and order history
- Deep linking via URL hash (#producto=OEM, #part=ID)
- Product detail pages with related parts, specs, and image galleries
- Spanish-language interface throughout
- Data is currently a curated local dataset (SUZUKI_PARTS), not a live API
- Backend is an Express server (server.ts) with Gemini API integration

## Brand Commitments

- Independent platform (not officially authorized by Suzuki)
- Uses "Suzuki" name and OEM part numbers for catalog accuracy
- No formal brand guidelines or logo assets provided
- Voice is technical, precise, and professional — matching the precision-oriented nature of motorcycle maintenance

## Evidence on Hand

- Fully functional React application with 18 components
- Curated parts database in `src/data/suzukiData.ts`
- AI assistant powered by Google Gemini
- Interactive SVG exploded-view diagrams
- WhatsApp widget for direct communication
- Checkout and order management system

## Product Principles

1. Compatibility is non-negotiable: every part shown must be verified against the user's motorcycle
2. Technical precision over marketing fluff: the interface speaks the language of mechanics
3. Reduce cognitive load: the garage-first workflow means users never wonder "will this fit my bike?"
4. Support the full journey: from identification (what part do I need?) through ordering and tracking

## Accessibility & Inclusion

- No product-specific accessibility requirements established
- Standard web accessibility practices should apply (semantic HTML, keyboard navigation, color contrast)
