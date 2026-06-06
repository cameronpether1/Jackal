---
name: Jackal
description: Real-time collaborative boards for small creative teams
colors:
  # Primary / Accent
  live-signal: "#0ea5e9"
  live-signal-dark: "#38bdf8"
  # Brand semantic (post types)
  frozen-lake: "#86d3fa"
  tangerine-dream: "#faad86"
  mint: "#86fa96"
  ivory: "#fffced"
  carbon-black: "#262626"
  # Neutral — light mode
  warm-canvas: "#f4f3f0"
  surface-white: "#ffffff"
  linen: "#f0ede8"
  near-black: "#1a1917"
  warm-granite: "#6b6a67"
  pale-stone: "#b0afa9"
  # Neutral — dark mode
  charcoal: "#111110"
  coal: "#1c1b19"
  slate: "#272523"
  # Sidebar (always dark)
  sidebar-bg: "#1f1e1b"
  sidebar-text: "#e0ddd8"
  # Semantic
  destructive: "#df3b27"
typography:
  display:
    fontFamily: "Geist Sans, sans-serif"
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Geist Sans, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Geist Sans, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Geist Sans, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
  mono:
    fontFamily: "Geist Mono, monospace"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
rounded:
  sm: "6px"
  md: "8px"
  lg: "10px"
  xl: "14px"
  2xl: "18px"
  full: "9999px"
spacing:
  1: "4px"
  2: "8px"
  3: "12px"
  4: "16px"
  6: "24px"
  8: "32px"
  12: "48px"
components:
  button-primary:
    backgroundColor: "{colors.live-signal}"
    textColor: "#ffffff"
    rounded: "{rounded.lg}"
    padding: "6px 10px"
    height: "32px"
  button-primary-hover:
    backgroundColor: "#38bdf8"
    textColor: "#0c1a2e"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.near-black}"
    rounded: "{rounded.lg}"
    padding: "6px 10px"
    height: "32px"
  button-outline-hover:
    backgroundColor: "{colors.linen}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.near-black}"
    rounded: "{rounded.lg}"
    padding: "6px 10px"
    height: "32px"
  button-ghost-hover:
    backgroundColor: "{colors.linen}"
  input:
    backgroundColor: "transparent"
    textColor: "{colors.near-black}"
    rounded: "{rounded.lg}"
    height: "32px"
    padding: "4px 10px"
  post-card:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.near-black}"
    rounded: "{rounded.2xl}"
    padding: "16px"
---

# Design System: Jackal

## 1. Overview

**Creative North Star: "The Live Room"**

Jackal feels like walking into a studio where a team is actively working. There is warmth in the air, color on the walls, and evidence of decisions in progress. The interface does not present itself as a blank slate waiting to be filled — it is a workspace already inhabited. Tonal warm neutrals and a tactile dot-grid canvas make the board feel physical and grounded. The four brand colors (Frozen Lake, Tangerine Dream, Mint, Ivory) are not decorative accents; they are semantic markers tied to post types, like colored sticky notes pinned to a real corkboard. Their presence on the board communicates meaning at a glance.

Typography is quiet and functional. Geist Sans carries everything — headings, labels, body, buttons — without drama. The system earns its character through color and motion, not typographic spectacle. Transitions run at 150–200ms because users in flow notice lag before they notice elegance. The dark sidebar anchors the product with a high-contrast left column that persists even in light mode, signaling that Jackal knows what it is: a workspace, not a document editor.

Delight lives in the moments: a confetti burst when a task list hits 100%, pulsing indicators when teammates are present, a smooth card drag that snaps into place. These are the gestures that make Jackal feel alive. The baseline chrome is restrained; the board surface is where the energy lives.

**Key Characteristics:**
- Warm, tactile neutral surfaces anchored by a persistent dark sidebar
- Four semantic brand colors that belong to post types, not to chrome
- Single-family sans (Geist) — no typographic decoration, weight does the work
- Snappy state transitions: 150–200ms, exponential ease-out
- Dot-grid canvas as the board's physical material

## 2. Colors

The palette is warm neutrals cut by a precise sky-blue signal, with four semantic brand colors that live on the board surface and nowhere else.

### Primary

- **Live Signal Blue** (`#0ea5e9` / dark: `#38bdf8`): The one CTA color. Primary buttons, focus rings, active selection indicators, board pulse animations. In dark mode, steps to a lighter sky to maintain contrast against dark surfaces. Its rarity outside the board gives it authority.

### Secondary

- **Frozen Lake** (`#86d3fa`): The note post type. Collaboration indicators and real-time pulse animations. A cooler, lighter sky — related to Live Signal but quieter, untethered from action.
- **Tangerine Dream** (`#faad86`): The task post type. Warm and attention-drawing without urgency. Checked task indicators and task-list card tints.
- **Mint** (`#86fa96`): Rich content and general note cards. A fresh, low-weight green that reads as "in progress" or "available."
- **Ivory** (`#fffced`): The reply/conversation context. The warmest and quietest of the four — backgrounds for threaded replies and conversation cards.

### Neutral

- **Carbon Black** (`#262626`): Text on colored elements (brand color swatches, colored badges). Ensures readability on all four brand colors.
- **Warm Canvas** (`#f4f3f0`): The main board background. Subtly warm — sits between white and linen without reading as cream.
- **Surface White** (`#ffffff`): Card and panel backgrounds. Clean contrast against Warm Canvas.
- **Linen** (`#f0ede8`): Sidebar panels, surface-offset contexts, hover states for secondary buttons.
- **Near Black** (`#1a1917`): Primary text. Warm, deep — never pure black.
- **Warm Granite** (`#6b6a67`): Secondary and supporting text. Timestamps, metadata, labels.
- **Pale Stone** (`#b0afa9`): Disabled states and placeholder text. Must meet 4.5:1 contrast against white backgrounds — verify before use at small sizes.
- **Charcoal / Coal / Slate** (`#111110` / `#1c1b19` / `#272523`): Dark mode background stack, three-step tonal depth.

**The Semantic Color Rule.** Frozen Lake, Tangerine Dream, Mint, and Ivory are reserved for post-type tinting and board-level state. They do not appear as general decoration on navigation, buttons, or chrome. Their absence from UI structure is precisely what makes them legible as data on the board.

**The Signal Rule.** Live Signal Blue is the sole primary action color. It lives on CTAs, focus rings, active selection, and board pulse. Diluting it with decorative uses elsewhere kills its authority.

## 3. Typography

**Body/UI Font:** Geist Sans (with `sans-serif` fallback)
**Mono Font:** Geist Mono (with `monospace` fallback)

**Character:** A technical-humanist sans that is slightly warmer than Inter and slightly more precise than a pure geometric. It handles dense labels and long-form body copy in the same weight family without needing a display face. The mono variant is used exclusively for code and short technical strings.

### Hierarchy

- **Display** (700, 2rem, lh 1.1, ls -0.02em): Board titles when shown large, welcome screens, modal headings.
- **Title** (600, 1.125rem, lh 1.3, ls -0.01em): Section labels, card type headings, sidebar board names.
- **Body** (400, 0.875rem, lh 1.5): Post content, descriptions, onboarding copy. Max line length 65–70ch.
- **Label** (500, 0.75rem, lh 1.4): Timestamps, metadata, button text, chip labels.
- **Mono** (400, 0.875rem, lh 1.6): Code blocks, technical identifiers only.

**The One-Family Rule.** Geist Sans covers all roles. Do not introduce a second sans or a display typeface. Weight contrast (400/500/600/700) provides hierarchy; no extra family needed.

## 4. Elevation

Jackal uses a hybrid model: tonal layer steps handle structural depth, ambient shadows handle interactive and floating surfaces.

**Tonal layer stack (light):** Warm Canvas (`#f4f3f0`) → Surface White (`#ffffff`) → Linen (`#f0ede8`). A surface higher in the stack sits atop the previous layer; the slight value difference conveys depth without a visible border.

**Tonal layer stack (dark):** Charcoal → Coal → Slate. Same logic: cooler/lighter = higher surface.

### Shadow Vocabulary

- **Card ambient** (`0 4px 20px rgba(0, 0, 0, 0.09)`): Post cards at rest on the board. Soft, diffuse — the card lifts off the canvas without competing for attention.
- **Card active / dragging** (`0 8px 32px rgba(0, 0, 0, 0.16)`): Post card being dragged. Doubled shadow signals elevation and movement.
- **Floating element** (`0 4px 24px rgba(0, 0, 0, 0.30)`): Floating toolbar, pill navbar, modals, dropdown panels. Intentionally deeper to separate from the board surface.
- **Signal glow** (`0 0 0 3px #0ea5e9`): Focus ring and live-action pulse. Color-based, not shadow-based; communicates state, not elevation.

**The Earned Shadow Rule.** Surfaces start flat. Shadows appear only on interactive or elevated elements — cards, modals, floating toolbars. Static structural panels use tonal layering, not shadow. If a section of the board has no interactive content, it has no shadow.

## 5. Components

### Buttons

Compact and undecorated. The primary button's roundness (10px radius) reads as modern-product without going full pill. Pill shape is reserved for the floating navbar and landing-page hero CTAs — distinct contexts, distinct affordances.

- **Shape:** 10px radius (`{rounded.lg}`). Exception: xs/sm sizes use `{rounded.md}` (8px). Pill (`{rounded.full}`) only for floating nav and marketing CTAs.
- **Primary:** Live Signal Blue (`#0ea5e9`) bg, white text, h-8 (32px), px-2.5. Hover: 80% opacity or `#38bdf8`. Transitions at 150ms ease-out.
- **Outline:** Transparent bg, `border-border`, hover fills with Linen. Used for secondary actions alongside a primary.
- **Ghost:** Transparent, no border, hover fills with Linen. Inline actions, toolbars, sidebar items.
- **Destructive:** Red-tinted (`destructive/10` bg, `destructive` text). Soft red — communicates danger without screaming.
- **Focus:** 3px ring, `ring-ring/50` (Live Signal at 50% opacity). Visible, accessible, not garish.

### Post Cards (Signature Component)

The central unit of the product. Draggable, color-typed, social.

- **Shape:** `{rounded.2xl}` (18px). Generous roundness — cards feel tactile, not sharp.
- **Background:** Surface White (`#ffffff`) regardless of mode.
- **Shadow:** Card ambient at rest; card active while dragging.
- **Color coding:** A subtle background tint and matching border at 30-35% opacity on the card signals post type (Frozen Lake for notes, Tangerine Dream for tasks, Mint for rich content, Ivory for replies). The white card body stays consistent; only the tint and its indicator change.
- **Author chip:** Small avatar (initials or photo) in the card's bottom-left. Avatar background uses a deterministic color derived from user ID via `getAvatarColor()` — not from the brand palette.
- **Drag state:** Elevated shadow + slight scale or rotation transform. The card feels picked up.

### Inputs / Fields

- **Style:** Transparent background, `border-input` (border at 8-10% opacity), 10px radius, h-8. Clean and recessive — the border only becomes visible on hover/focus.
- **Focus:** `border-ring` (Live Signal), 3px ring at 50% opacity. Clear, accessible.
- **Disabled:** 50% opacity, no-pointer cursor, input fills with `bg-input/50`.
- **Error:** `border-destructive`, red ring.

### Navigation — Sidebar

- **Always dark** regardless of light/dark mode. Uses the sidebar token stack (`--sidebar`, `--sidebar-foreground`, etc.). The sidebar is the dark anchor of the product in all themes.
- **Board items:** Small colored dot (one of `bg-sky-400`, `bg-pink-400`, `bg-blue-400`, etc.) identifies each board. Active item uses `sidebar-accent` bg.
- **Bottom area:** User avatar, plan badge, theme toggle, sign out. Compact, secondary.

### Navigation — Floating Pill Navbar (Landing only)

- **Style:** Dark pill (`#0c1a2e`), `{rounded.full}`, deep shadow. White text and icon. Sticky top with `pt-4` float above content.
- **CTAs:** Ghost login + pill CTA in Live Signal Blue.
- This pattern is exclusive to marketing surfaces; do not use in the product app.

### Canvas / Board Area

- **Background:** Dot-grid pattern — radial-gradient dots at 24px pitch. Light mode: `rgba(0,0,0,0.12)` dots on Warm Canvas. Dark mode: `rgba(255,255,255,0.08)` dots on Charcoal.
- The dot grid is the physical material of the board. It communicates "spatial, moveable, canvas" without any additional chrome.

## 6. Do's and Don'ts

### Do:

- **Do** use Live Signal Blue (`#0ea5e9`) only for primary CTAs, focus rings, active selection, and board pulse. Its power comes from scarcity.
- **Do** keep the sidebar dark in all modes. It is a deliberate design decision, not a dark-mode artifact.
- **Do** apply the four brand colors (Frozen Lake, Tangerine Dream, Mint, Ivory) to post-type tinting and board-level state only. Never to navigation, buttons, or chrome.
- **Do** use the three-step tonal surface stack (`warm-canvas → surface-white → linen`) for structural depth. Reserve shadows for interactive elements.
- **Do** run transitions at 150–200ms with `ease-out-quart` or equivalent exponential easing. Users are in flow; don't make them wait for choreography.
- **Do** include `@media (prefers-reduced-motion: reduce)` for every animation — substitute a crossfade or instant state change.
- **Do** maintain 4.5:1 minimum contrast for all body text. Check Warm Granite (`#6b6a67`) on Warm Canvas (`#f4f3f0`) — it passes, but verify when using tinted surfaces.
- **Do** use the post-card's 18px radius (`{rounded.2xl}`) for board content and the standard 10px (`{rounded.lg}`) for UI controls. Distinguish content affordances from UI affordances by radius.

### Don't:

- **Don't** use Notion's document-heavy UI patterns: dense nesting, collapsible outline hierarchies, full-page text editor mode as the primary surface.
- **Don't** design generic SaaS landing pages: cream/warm-sand body backgrounds, bento grids of identical feature cards, "ABOUT / FEATURES / PRICING" eyebrows on every section, hero-metric number grids. The landing page should feel like Jackal, not like a landing page template.
- **Don't** introduce a second font family. Geist Sans covers all roles. A display typeface in buttons or labels is an immediate out-of-system error.
- **Don't** use the four brand colors (Frozen Lake, Tangerine Dream, Mint, Ivory) as general accent or decoration. They communicate post type. Using Frozen Lake as a hover color on a sidebar item breaks the semantic contract.
- **Don't** use gradient text (`background-clip: text`). No gradient text anywhere.
- **Don't** add decorative motion that doesn't convey state. No entrance animations for sidebar items, no parallax on the board, no orchestrated page-load sequences. Motion earns its place in state changes (drag, completion, pulse), not in decoration.
- **Don't** nest cards inside cards. The post card is the unit; content lives inside it, not another card.
- **Don't** use side-stripe borders (`border-left > 1px`) as accents on cards or list items. Use background tints or full borders instead.
- **Don't** use all-caps body copy. Uppercase is reserved for short chip labels (≤4 words) and badge text only.
