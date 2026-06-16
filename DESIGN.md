---
name: Jackal
description: Real-time collaborative boards for small creative teams
colors:
  # Primary / Accent
  live-signal: "#0ea5e9"
  live-signal-dark: "#38bdf8"
  # Board semantic (post types)
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
  # Neutral — dark stack / dark islands
  charcoal: "#111110"
  coal: "#1c1b19"
  slate: "#272523"
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
  island: "22px"
  panel: "24px"
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
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.near-black}"
    rounded: "{rounded.lg}"
    padding: "6px 10px"
    height: "32px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.near-black}"
    rounded: "{rounded.lg}"
    padding: "6px 10px"
    height: "32px"
  button-pill-cta:
    backgroundColor: "{colors.live-signal}"
    textColor: "#ffffff"
    rounded: "{rounded.full}"
    padding: "6px 12px"
    height: "28px"
  button-dark-island-action:
    backgroundColor: "rgba(255,255,255,0.08)"
    textColor: "rgba(255,255,255,0.7)"
    rounded: "{rounded.full}"
    width: "32px"
    height: "32px"
  input:
    backgroundColor: "transparent"
    textColor: "{colors.near-black}"
    rounded: "{rounded.lg}"
    height: "32px"
    padding: "4px 10px"
  input-dark:
    backgroundColor: "rgba(255,255,255,0.08)"
    textColor: "#ffffff"
    rounded: "{rounded.full}"
    height: "32px"
    padding: "8px 14px"
  dark-island-pill:
    backgroundColor: "{colors.coal}"
    textColor: "#ffffff"
    rounded: "{rounded.full}"
    padding: "8px 8px"
  dark-card-panel:
    backgroundColor: "{colors.coal}"
    textColor: "#ffffff"
    rounded: "{rounded.panel}"
    padding: "20px"
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

The floating chrome — toolbar, topbar, dialogs, info pills — speaks a unified language: Coal (`#1c1b19`), always dark regardless of the active theme, surfaced with an inner edge highlight that catches light like a machined metal edge. These dark islands float over the board at different elevations, visually separating workspace chrome from workspace content. The pattern is deliberate and consistent: when you see Coal, you are touching a control surface, not a piece of content.

Typography is quiet and functional. Geist Sans carries everything without drama. The system earns its character through color and motion, not typographic spectacle. State transitions run at 150–200ms because users in flow notice lag before they notice elegance. Delight lives in specific moments: a confetti burst when a task list hits 100%, the frosted glass bloom as a post morphs open, a smooth card drag that snaps into place. The baseline chrome is restrained; the board surface is where the energy lives.

**Key Characteristics:**
- Warm, tactile neutral surfaces anchored by a persistent dark sidebar
- Four semantic brand colors belonging to post types only — never to chrome
- Coal dark islands: all floating chrome (topbar, toolbar, dialogs, info pills) uses `#1c1b19` with a consistent inner-edge highlight shadow, in both light and dark modes
- Single-family sans (Geist) — no typographic decoration, weight does the work
- Snappy state transitions: 150–200ms, exponential ease-out
- Dot-grid canvas as the board's physical material
- GSAP-powered post expansion: morph from card to overlay, frosted glass bloom, bottom pill stagger

## 2. Colors: The Warm Signal Palette

Four semantic post-type colors cut through a warm neutral ground, unified by a single sky-blue signal and anchored by Coal dark islands.

### Primary

- **Live Signal Blue** (`#0ea5e9` / dark mode: `#38bdf8`): The one CTA color. Primary buttons, focus rings, active selection indicators, board pulse animations, the Invite pill in the topbar. In dark mode, steps to a lighter sky to maintain contrast. Its rarity outside the board gives it authority.

### Secondary

- **Frozen Lake** (`#86d3fa`): The note post type. A cooler, lighter sky related to Live Signal but quieter, untethered from action. Also used for collaboration indicators and real-time presence pulse.
- **Tangerine Dream** (`#faad86`): The task post type. Warm and attention-drawing without urgency. Task-list card tints and checked task indicators.
- **Mint** (`#86fa96`): Rich content and general note cards. A fresh, low-weight green that reads "in progress" or "available."
- **Ivory** (`#fffced`): The reply/conversation context. Warmest and quietest of the four — backgrounds for threaded replies and conversation cards.

### Tertiary

- **Carbon Black** (`#262626`): Text rendered on colored post-type elements. Ensures readability on all four brand colors regardless of their lightness.

### Neutral

- **Warm Canvas** (`#f4f3f0`): The main board background. Subtly warm — sits between white and linen without reading as cream.
- **Surface White** (`#ffffff`): Post card and main panel backgrounds.
- **Linen** (`#f0ede8`): Surface-offset contexts and ghost button hover fill.
- **Near Black** (`#1a1917`): Primary text. Warm, deep — never pure black.
- **Warm Granite** (`#6b6a67`): Secondary text. Timestamps, metadata, supporting labels.
- **Pale Stone** (`#b0afa9`): Disabled states, placeholder text. Verify 4.5:1 contrast at small sizes before use.
- **Charcoal** (`#111110`) / **Coal** (`#1c1b19`) / **Slate** (`#272523`): Dark mode background stack and, critically, the dark island surface. Coal is the specific value for all floating chrome — topbar pill, floating toolbar, dark dialog cards, info pills in the post overlay. It is not a dark-mode exclusive; it appears in light mode as a deliberate contrast surface.
- **Destructive** (`#df3b27`): Error states, destructive actions.

**The Semantic Color Rule.** Frozen Lake, Tangerine Dream, Mint, and Ivory are reserved for post-type tinting and board-level state. They do not appear as general decoration on navigation, buttons, or chrome. Their absence from UI structure is precisely what makes them legible as data on the board.

**The Signal Rule.** Live Signal Blue is the sole primary action color. It lives on CTAs, focus rings, active selection, board pulse, and the topbar invite pill CTA. Diluting it with decorative uses elsewhere kills its authority.

**The Dark Island Rule.** All floating chrome surfaces use Coal (`#1c1b19`) with the inner-edge highlight (`inset 0 1px 0 rgba(255,255,255,0.07–0.08)`), in both light and dark mode. This creates a consistent spatial language: Coal = control surface. Do not use Coal as a general card background, hover tint, or decorative dark element.

## 3. Typography

**Display/UI Font:** Geist Sans (with `sans-serif` fallback)
**Mono Font:** Geist Mono (with `monospace` fallback)

**Character:** A technical-humanist sans that is slightly warmer than Inter and slightly more precise than a pure geometric. It handles dense labels and long-form body copy in the same weight family without a display face. Weight contrast (400/500/600/700) delivers hierarchy with no second family required.

### Hierarchy

- **Display** (700, 2rem, lh 1.1, ls -0.02em): Board titles, welcome screens, large modal headings.
- **Title** (600, 1.125rem, lh 1.3, ls -0.01em): Section labels, card type headings, sidebar board names.
- **Body** (400, 0.875rem, lh 1.5): Post content, descriptions, onboarding copy. Max line length 65–70ch.
- **Label** (500, 0.75rem, lh 1.4): Timestamps, metadata, button text, chip labels, all topbar text.
- **Mono** (400, 0.875rem, lh 1.6): Code blocks, share link URLs, technical identifiers only.

**Dark Island Type Scale.** Within Coal dark island surfaces, text uses white/opacity ramps rather than token colors: `rgba(255,255,255,0.90)` for primary labels, `rgba(255,255,255,0.45)` for secondary, `rgba(255,255,255,0.28)` for tertiary/disabled. Role badges and metadata use `bg-white/[0.07]` tinted pills with `text-white/30` text.

**The One-Family Rule.** Geist Sans covers all roles. Do not introduce a second sans or a display typeface. A display typeface in buttons or labels is an immediate out-of-system error.

## 4. Elevation

Jackal uses a three-layer elevation model: tonal step differences handle structural depth, ambient shadows handle interactive surfaces, and dark island shadows handle floating chrome. The hierarchy is unambiguous — darker surface + deeper shadow = further from the canvas.

**Tonal layer stack (light):** Warm Canvas → Surface White → Linen. The slight value difference between steps conveys depth without a visible border.

**Tonal layer stack (dark):** Charcoal → Coal → Slate. Same logic inverted: lighter = higher.

### Shadow Vocabulary

- **Card ambient** (`0 4px 20px rgba(0,0,0,0.09)`): Post cards at rest. Soft, diffuse — the card lifts off the canvas without competing for attention.
- **Card active / dragging** (`0 8px 32px rgba(0,0,0,0.16)`): Post card being dragged. Doubled shadow signals elevation and active movement.
- **Floating element** (`0 4px 24px rgba(0,0,0,0.30)`): Generic floating panels and dropdowns.
- **Dark island ambient** (`0 8px 32px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.07)`): Floating pill topbar, floating toolbar. The inset highlight reads as a machined top edge catching light, grounding the island as a physical object rather than a flat card.
- **Dark island deep** (`0 16px 48px rgba(0,0,0,0.50), inset 0 1px 0 rgba(255,255,255,0.08)`): Modal dark card panels (InvitePanel, ShareModal). Same language as ambient but with greater vertical throw for higher z-index surfaces.
- **Signal glow** (`0 0 0 3px rgba(14,165,233,0.5)`): Focus ring and live-action pulse. Color-based, not elevation-based — communicates state, not depth.

**The Earned Shadow Rule.** Surfaces start flat. Shadows appear only on interactive or elevated elements — cards, modals, floating toolbars. Static structural panels use tonal layering. If a section of the board has no interactive content, it has no shadow.

**The Island Consistency Rule.** Every Coal dark island uses the same inner-edge highlight pattern (`inset 0 1px 0 rgba(255,255,255,0.07–0.08)`). Never deviate from this value. It is the physical signature of the dark island system.

## 5. Components

### Buttons

Compact and undecorated. The primary button's 10px radius reads as modern-product without going full pill. Pill shape is reserved for dark island CTAs — distinct context, distinct affordance.

- **Shape:** 10px radius (`{rounded.lg}`). Exception: xs/sm sizes use 8px. Pill (`{rounded.full}`) only for dark island CTAs and marketing hero buttons.
- **Primary:** Live Signal Blue bg, white text, h-8 (32px), px-2.5. Hover: `#38bdf8`. Transitions at 150ms ease-out.
- **Outline:** Transparent bg, `border-border`, hover fills with Linen. Secondary actions alongside a primary.
- **Ghost:** Transparent, no border, hover fills with Linen. Inline actions, toolbars, sidebar items.
- **Destructive:** `bg-destructive/10`, `text-destructive`. Soft red — danger without shouting.
- **Dark island action:** `w-8 h-8 rounded-full`, `bg-white/[0.08]`, `text-white/40`. Hover: `bg-white/[0.14] text-white/70`. Used for icon buttons within Coal surfaces.
- **Pill CTA (dark island):** Live Signal Blue, `rounded-full`, h-7, px-3. The single primary action within a dark island surface.
- **Focus:** 3px ring, `ring-ring/50` (Live Signal at 50% opacity). Visible, accessible.

### Post Cards (Signature Component)

The central unit of the product. Draggable, color-typed, social.

- **Shape:** 18px radius (`{rounded.2xl}`). Generous roundness — cards feel tactile, not sharp.
- **Background:** Surface White regardless of theme.
- **Shadow:** Card ambient at rest; card active while dragging.
- **Rotation:** All cards render at 0° (no random tilt). Only during drag does a lift transform apply.
- **Color coding:** A top-border tint at 30–35% opacity signals post type (Frozen Lake / Tangerine Dream / Mint / Ivory). The card body stays white.
- **Author badge:** `w-10 h-10 rounded-full ring-[3px] ring-white` pinned to `-top-5 -right-5`. Background color from `getAvatarColor(userId)` — deterministic, not from the brand palette.
- **Comment button:** `GlassButton glassVariant="frosted"` (LiquidGlass SVG displacement). Hover-only, `bottom-2 right-2`. The only appearance of LiquidGlass on light surfaces in the product.

### Dark Island Pill Topbar

The board's primary navigation. Floating, centered, always Coal regardless of theme.

- **Container:** `absolute top-4 left-1/2 -translate-x-1/2`, `bg-[#1c1b19] rounded-full`. Shadow: dark island ambient.
- **Anatomy (left to right):** member-count icon button → `w-px h-3.5 bg-white/[0.1]` divider → board name (`text-xs font-semibold text-white/90`) → divider → icon action buttons (Share, Export) → gap → Invite pill CTA.
- **Icon buttons:** `w-8 h-8 rounded-full text-white/40`. Hover: `bg-white/[0.08] text-white/70`.
- **Z-index:** `z-30` within the board layout — above canvas, below modals.

### Floating Toolbar (Board Controls)

Bottom-center dark island. Tool selector + sticker picker + zoom controls.

- **Container:** `fixed bottom-[safe-area + 1.5rem] left-1/2 -translate-x-1/2`, Coal bg, `rounded-[22px]`. Shadow: `0 8px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.07)`.
- **Buttons:** `w-9 h-9 rounded-[12px]`. Active: `bg-white/[0.15] text-white`. Inactive: `text-white/40 hover:bg-white/[0.08]`.
- **Sticker tray:** Springs open above the toolbar row via `motion/react` (spring stiffness 340, damping 28). Items stagger in at 45ms delay per item. The tray and toolbar grow together inside the same Coal container.
- **Motion:** `MotionConfig reducedMotion="user"` suppresses all spring animations when the user prefers reduced motion.
- **Dividers:** `h-px bg-white/[0.06]` between tray and toolbar row.

### Dark Card Panels (Dialogs)

Modals that float above the board use Coal dark cards instead of the standard popover shell.

- **Container:** `bg-[#1c1b19] rounded-[24px]`. Shadow: dark island deep.
- **Positioning:** Dialog anchored at `top-[72px] translate-y-0` — just below the topbar pill, not screen center.
- **Header:** board name in `text-sm font-semibold text-white/90`, sub-label in `text-xs text-white/35`.
- **Dividers:** `h-px bg-white/[0.06] mx-4`.
- **List rows:** `hover:bg-white/[0.04]` fill, `rounded-xl` hit area. Role badges: `bg-white/[0.07] text-white/30 text-[10px] rounded-full`.
- **Inputs within:** `bg-white/[0.08] border border-white/[0.1] rounded-full text-xs text-white`. Focus: `border-white/25 bg-white/[0.12]`.
- **CTA within:** Live Signal Blue pill, same spec as the topbar Invite button.
- **Dialog shell:** `bg-transparent border-0 shadow-none ring-0` — the Coal card is the only visible surface.

### Frosted Glass Post Overlay (Signature Component)

The expanded post view, driven by GSAP.

- **Morph panel:** `fixed inset-0 z-[70]`. GSAP scales from the card's bounding rect to full screen at `power3.out` over 500ms. Transparent during morph — content visible from the start.
- **Frosted glass layer:** `fixed inset-0 z-[69]`, sibling (not child) of the morph panel. `background: rgba(244,244,242,0.82)`, `backdrop-filter: blur(24px) saturate(160%)`. Fades `opacity: 0 → 1` over 250ms (`power2.out`) starting in parallel with the morph open. Never transforms — pure opacity.
- **Info pills:** `absolute bottom-5 left-5 right-5`. Three Coal pills (author, date, Comment CTA). Stagger in at 70ms intervals after the glass fade completes.
- **Close sequence:** Pills and glass fade out together (180ms) → morph panel returns to card rect (400ms `power3.in`) → `clearProps` restores the card.
- **Keyboard:** `Escape` closes.

### Canvas / Board Area

- **Background:** Dot-grid, `radial-gradient(circle, rgba(0,0,0,0.12) 1px, transparent 1px)` at 24px pitch. Dark mode: `rgba(255,255,255,0.08)`.
- The dot grid is the board's physical material — communicates "spatial, moveable, canvas" without additional chrome.

### Sidebar Navigation

- **Always dark** regardless of light/dark mode. Uses the sidebar token stack (`--sidebar`, `--sidebar-foreground`, etc.).
- **Board items:** Small colored dot per board. Active item: `sidebar-accent` bg. Bottom area: user avatar, plan badge, theme toggle, sign out.

### Inputs / Fields

- **Light surface:** Transparent bg, `border-input` (8-10% opacity), 10px radius, h-8. Focus: `border-ring`, 3px ring at 50% opacity.
- **Dark island surface:** `bg-white/[0.08]`, `border-white/[0.1]`, `rounded-full`. Focus: `border-white/25`, `bg-white/[0.12]` lift.

## 6. Do's and Don'ts

### Do:

- **Do** use Live Signal Blue (`#0ea5e9`) only for primary CTAs, focus rings, active selection, board pulse, and the topbar invite pill. Scarcity is the point.
- **Do** use Coal (`#1c1b19`) with `inset 0 1px 0 rgba(255,255,255,0.07–0.08)` inner edge on every dark island surface. The highlight is non-negotiable — it is the physical signature of the system.
- **Do** keep the sidebar dark in all themes. It is a deliberate design decision, not a dark-mode artifact.
- **Do** apply Frozen Lake, Tangerine Dream, Mint, and Ivory to post-type tinting and board-level state only — never to navigation, buttons, or chrome.
- **Do** use the three-step tonal surface stack (Warm Canvas → Surface White → Linen) for structural depth. Reserve shadows for interactive or elevated elements.
- **Do** run transitions at 150–200ms with `power3.out` / `power2.out` (GSAP) or `cubic-bezier(0.25, 1, 0.5, 1)` (CSS).
- **Do** include `prefers-reduced-motion` alternatives for every animation — `MotionConfig reducedMotion="user"` for Motion, `@media (prefers-reduced-motion: reduce)` for CSS.
- **Do** maintain 4.5:1 minimum contrast for all body text. Verify Warm Granite (`#6b6a67`) on tinted surfaces before use.
- **Do** use 18px post-card radius (`{rounded.2xl}`) for board content and 10px (`{rounded.lg}`) for UI controls. The radius difference encodes content vs. control.
- **Do** block right-click (`e.button !== 0`) on any `onPointerDown` handler that opens an overlay — preserve the context menu.
- **Do** use `flushSync` before GSAP animations when the target is inside a conditional render block.

### Don't:

- **Don't** use Notion's document-heavy patterns: dense nesting, collapsible outline hierarchies, full-page text editor as the primary surface.
- **Don't** design generic SaaS landing pages: cream/warm-sand backgrounds, bento grids of identical feature cards, eyebrows on every section, hero-metric number grids. Jackal's landing page should feel like Jackal.
- **Don't** design with Jira's enterprise-grey, configuration-first, intimidating information density.
- **Don't** introduce a second font family. Geist Sans covers all roles.
- **Don't** use Frozen Lake, Tangerine Dream, Mint, or Ivory as general decoration on chrome. Using Frozen Lake as a hover color on a sidebar item breaks the semantic contract.
- **Don't** apply Coal dark island treatment to non-floating surfaces. Settings forms, sidebar sections, and inline panels do not earn Coal treatment — they belong to the tonal stack.
- **Don't** use gradient text (`background-clip: text` + gradient). No gradient text anywhere.
- **Don't** add decorative motion that doesn't convey state. No entrance animations for sidebar items, no parallax, no orchestrated page-load sequences.
- **Don't** nest cards inside cards. The post card is the atomic content unit.
- **Don't** use side-stripe borders (`border-left > 1px`) as accent on cards or list items. Use background tints or full borders.
- **Don't** use all-caps body copy. Uppercase is reserved for short chip labels (≤4 words).
- **Don't** show the source post card during the close morph — it creates a double-post flash. Keep it hidden until `clearProps` fires in the morph's `onComplete`.
- **Don't** place the frosted glass layer as a child of the morphing panel. It must be a sibling in the portal at its own `fixed inset-0` position, otherwise it transforms with the morph.
