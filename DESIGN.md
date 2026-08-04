---
name: Suzuki Parts Expert
description: Genuine Suzuki motorcycle parts e-commerce with guaranteed compatibility matching
colors:
  primary: "#E60012"
  primary-deep: "#b5000b"
  performance-blue: "#0A3088"
  performance-blue-light: "#3d59b1"
  surface-bg: "#f7f9fb"
  neutral-900: "#191c1e"
  neutral-800: "#1e2124"
  neutral-700: "#374151"
  neutral-600: "#4b5563"
  neutral-500: "#6b7280"
  neutral-400: "#9ca3af"
  neutral-300: "#d1d5db"
  neutral-200: "#e5e7eb"
  neutral-100: "#f3f4f6"
  neutral-50: "#f9fafb"
  white: "#ffffff"
  compatible: "#059669"
  compatible-light: "#d1fae5"
  compatible-bg: "#ecfdf5"
  warning: "#d97706"
  warning-light: "#fef3c7"
  warning-bg: "#fffbeb"
  incompatible: "#dc2626"
  incompatible-light: "#fee2e2"
  incompatible-bg: "#fef2f2"
  whatsapp: "#25D366"
typography:
  display:
    fontFamily: "Geist, system-ui, sans-serif"
    fontWeight: 900
    letterSpacing: "-0.02em"
  heading:
    fontFamily: "Geist, system-ui, sans-serif"
    fontWeight: 900
    lineHeight: 1.2
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontWeight: 700
    fontSize: "0.6875rem"
    letterSpacing: "0.05em"
    textTransform: "uppercase"
  mono:
    fontFamily: "Geist, monospace"
    fontWeight: 700
rounded:
  card: "16px"
  button: "12px"
  input: "12px"
  badge: "8px"
  small: "6px"
  pill: "9999px"
spacing:
  section: "24px"
  card: "20px"
  tight: "12px"
  gap: "16px"
---

# Design System: Suzuki Parts Expert

## Overview

**Creative North Star: "The Precision Workshop"**

A technical, utilitarian interface built for motorcycle owners and mechanics who value accuracy over aesthetics. The system prioritizes functional clarity — compatibility status, OEM references, and part specifications are always visible and unambiguous. The visual language borrows from workshop environments: structured, high-contrast, information-dense, with the Suzuki red serving as a precision accent rather than decorative color.

**Key Characteristics:**
- Compatibility-first information hierarchy: green (compatible), red (incompatible), amber (unvalidated) are the primary visual signals
- Technical typography: uppercase labels, monospace OEM numbers, dense data tables
- White cards on a cool-grey surface with minimal shadow, relying on border contrast for depth
- Responsive sidebar-plus-grid catalog layout
- Workshop-grade density: compact spacing, small font sizes, information packed into every surface

## Colors

The palette is built around Suzuki's red with a neutral slate foundation. Color serves a functional role: compatibility status is the most critical visual signal and uses a traffic-light system.

### Primary
- **Suzuki Red** (#E60012): Primary brand accent, active tab indicators, focus rings, primary CTAs ("Añadir"), danger/incompatible states. Used sparingly on interactive elements and status badges.
- **Suzuki Red Deep** (#b5000b): Hover state for primary CTAs.

### Secondary
- **Performance Blue** (#0A3088): Technical/educational accent — used on schematic icons, explainer elements, and some link states. Less prominent than red.
- **Performance Blue Light** (#3d59b1): Hover and secondary blue states.

### Neutral
- **Surface Background** (#f7f9fb): Page background — a cool blue-grey that distinguishes from pure white cards.
- **Card White** (#ffffff): All card and container backgrounds.
- **Neutral-900** (#191c1e): Primary text, headings, high-emphasis labels.
- **Neutral-500** (#6b7280): Secondary text, descriptions, less-emphasized labels.
- **Neutral-400** (#9ca3af): Placeholder text, icon colors, dividers.
- **Neutral-200** (#e5e7eb): Card borders, separator lines, input borders.
- **Neutral-100** (#f3f4f6): Spec highlight backgrounds, subtle fills.
- **Neutral-50** (#f9fafb): Input backgrounds, filter panel backgrounds.

### Status Colors
- **Compatible Green** (#059669): Compatibility badge, stock indicators, successful validation.
- **Compatible Light** (#d1fae5): Compatible badge background.
- **Warning Amber** (#d97706): Unvalidated garage state, "Validar Moto" prompts.
- **Warning Light** (#fef3c7): Warning badge background.
- **Incompatible Red** (#dc2626): "No Compatible" badges, error states.
- **Incompatible Light** (#fee2e2): Incompatible badge background.
- **WhatsApp Green** (#25D366): WhatsApp contact button.

### Named Rules
**The Traffic Light Rule.** Every product card must show exactly one compatibility status color at the top. Green = compatible, red = incompatible, amber = no motorcycle selected. This is the most important visual signal in the interface.

**The Red Accent Rule.** Suzuki Red (#E60012) appears on ≤15% of any given screen area. Its scarcity preserves its power as a precision signal — active states, CTAs, and critical status only.

## Typography

**Display Font:** Geist (system-ui fallback)
**Body Font:** Inter (system-ui fallback)
**Mono/Data Font:** Geist monospace

**Character:** Technical and precise. Geist's geometric forms carry authority for headings and brand elements. Inter provides clean readability for body text and UI labels. Monospace is reserved for OEM numbers, spec values, and technical identifiers — reinforcing the workshop/precision aesthetic.

### Hierarchy
- **Display** (900 weight, -0.02em tracking): Brand name "SUZUKI", section titles ("Catálogo Oficial Suzuki Parts"). Used at 1.25rem–1.5rem.
- **Heading** (900 weight, 1.2 line-height): Card titles, modal headers, page-level section headings. 1rem–1.25rem.
- **Title** (bold/700, 0.875rem): Sub-section headers, filter group labels, spec highlights.
- **Body** (400 weight, 0.875rem): Descriptions, explanatory text, longer copy. Max width constrained by card padding.
- **Label** (700 weight, 0.6875rem, 0.05em uppercase): Category tags, status badges, filter labels, column headers. The dominant text style for navigational and categorical elements.
- **Mono** (Geist mono, 700, 0.6875rem–0.75rem): OEM reference numbers, spec values, price formatting, stock counts. Always paired with a label prefix.

### Named Rules
**The Mono Lock Rule.** OEM numbers, part specifications, and prices always render in Geist monospace. This creates an immediate visual distinction between human-readable labels and machine-precision data.

## Layout

**Container:** Max-width 1280px (7xl), centered, with responsive horizontal padding (16px mobile → 24px tablet → 32px desktop).

**Primary Grid:** The catalog page uses a two-column layout: a fixed-width sidebar filter (280px on desktop, full-width drawer on mobile) alongside a flexible product grid. The product grid responsively stacks from 1-column (mobile) → 2-column (sm) → 3-column (xl).

**Vertical Rhythm:** Sections use 24px vertical spacing. Cards within sections use 16px gap. Internal card padding is 20px (4–5 on Tailwind scale).

**Density:** Comfortable-to-dense. Information is packed tightly but maintains legibility through consistent spacing and strong typographic hierarchy. Mobile collapses to single-column with full-width cards.

**Breakpoints:** sm (640px), md (768px), lg (1024px), xl (1280px). Mobile navigation collapses to a hamburger drawer. Search bar hides behind a toggle on mobile.

## Elevation & Depth

**Philosophy:** Flat-by-default with subtle tonal layering. The page background (#f7f9fb) creates natural depth against white cards without needing shadows. Shadows are reserved for interactive elevation changes.

### Shadow Vocabulary
- **Resting card** (`shadow-xs`): Near-invisible base shadow on cards and containers. Purpose: subtle separation from background.
- **Hover card** (`hover:shadow-lg hover:shadow-slate-950/5`): Elevated shadow on card hover. Purpose: indicates interactivity and lifts the card above neighbors.
- **Sticky navbar** (`shadow-xs`): Persistent top shadow on the fixed header. Purpose: separates nav from scrollable content.
- **Modal overlay** (implied): Modals and drawers use backdrop overlay for depth.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest. Shadows appear only as a response to state (hover, sticky positioning, modal overlay). No decorative shadows.

## Shapes

**Corner Language:** Rounded-2xl (16px) for major containers (cards, modals, panels). Rounded-xl (12px) for interactive elements (buttons, inputs, filter chips). Rounded-lg (8px) for badges, tags, small elements. Rounded-full (9999px) for avatar circles and status dots.

**Borders:** 1px solid borders in neutral-200 (#e5e7eb) define card edges. Status-dependent borders shift to compatible-green, incompatible-red, or warning-amber. No decorative borders; all borders serve structural or status purposes.

**Silhouette:** Rectangular with generous rounding. No sharp corners anywhere in the system. The rounding creates approachability while the dense information layout maintains technical authority.

## Components

### Product Card
- **Shape:** Rounded-2xl (16px), full-width within grid cell
- **Background:** White (#ffffff)
- **Border:** 1px neutral-200 at rest; shifts to compatible-green, incompatible-red, or neutral-200 based on compatibility status
- **Shadow:** shadow-xs at rest; hover:shadow-lg on hover
- **Internal Structure:** Compatibility badge bar (top) → Image area (4:3 aspect) → Info section (name, description, specs) → Vehicle badges → Price + action buttons (bottom)
- **Compatibility Badge:** Full-width bar at top with traffic-light coloring (green/red/amber), icon, and uppercase label
- **Action Buttons:** Rounded-xl, full-height. "Añadir" = Suzuki Red background, white text. "No Compatible" = red-100 background, disabled state. "Validar Moto" = amber background.

### Navbar
- **Shape:** Sticky, full-width, white background, 64–80px height
- **Structure:** Logo (left) → Search bar (center, desktop only) → Navigation tabs (right, desktop) → Action icons (far right)
- **Logo:** Red rounded-xl square with white "S" + "SUZUKI" text in red + "GENUINE PARTS" in neutral-900
- **Tabs:** Uppercase, small font, active tab = red text + red-50 background + bottom border. Inactive = neutral-600, hover = neutral-900.
- **Action Icons:** Ghost buttons with neutral-700, hover = red text + neutral-50 background

### Compatibility Selector
- **Shape:** Rounded-2xl, centered, max-width 896px
- **Background:** White with border-neutral-200 and shadow-md (elevated above other cards)
- **Active State Banner:** Dark slate-900 background with emerald-green status indicator and white text
- **Form Layout:** Horizontal row of select dropdowns (model → year → version) with red CTA button

### Sidebar Filter
- **Shape:** Rounded-2xl, sticky (top-24), full-width on mobile (drawer)
- **Background:** White with border-neutral-200
- **Sections:** Collapsible filter groups with chevron toggles. Each group has an uppercase label and checkbox/slider controls.
- **Active Filters:** Shown as chips with remove (×) capability
- **Reset Button:** Ghost style, rotate-ccw icon, neutral text

### Exploded View Diagram
- **Shape:** Full max-width container with white rounded-2xl background
- **Structure:** Title bar with diagram picker tabs → SVG diagram with interactive hotspots → Parts list sidebar
- **Hotspots:** Numbered circles on the SVG, click to reveal part details
- **Zoom Controls:** Floating zoom-in/zoom-out buttons

### Buttons
- **Primary:** Suzuki Red (#E60012) background, white text, rounded-xl (12px), uppercase, bold, shadow-xs. Hover = red-deep.
- **Secondary/Ghost:** Transparent background, neutral text, rounded-xl. Hover = neutral-50 background.
- **Danger:** Red-100 background, red text, disabled appearance.
- **Warning:** Amber-500 background, white text.
- **CTA (Garage):** Dark slate-900 background, white text, with motorcycle icon.

### Inputs / Fields
- **Style:** Neutral-50 background, neutral-200 border, rounded-xl (12px), Inter font, 0.875rem
- **Focus:** Ring-2 with Suzuki Red at 20% opacity, border shifts to Suzuki Red
- **Placeholder:** Neutral-400 text
- **Select Dropdowns:** Same styling with custom chevron icon

## Do's and Don'ts

### Do:
- **Do** always show the compatibility status badge at the top of every product card — this is the single most important UI element
- **Do** use Geist monospace for all OEM numbers, spec values, and prices — never render technical data in the body font
- **Do** use uppercase + letter-spacing for categorical labels (OEM, category, filter groups)
- **Do** maintain the traffic-light status system consistently: green = compatible, red = incompatible, amber = unvalidated
- **Do** keep card backgrounds white on the cool-grey (#f7f9fb) surface — the contrast is the primary depth mechanism
- **Do** use rounded-2xl for containers, rounded-xl for interactive elements, rounded-lg for badges

### Don't:
- **Don't** use Suzuki Red as a background大面积 — it is a precision accent, not a surface color
- **Don't** add decorative shadows to resting cards — shadows are for hover elevation only
- **Don't** mix technical/monospace text with body text in the same line — keep them visually distinct
- **Don't** use warm or neutral-warm backgrounds — the system is cool-toned (blue-grey surface, white cards)
- **Don't** add decorative elements, gradients, or visual flourishes — the system is functional and utilitarian
- **Don't** break the compatibility status color system with custom status colors — green/red/amber only
