---
name: Wantlist
description: A vibrant, lightweight product UI for universal wishlists, sharing, and private reservations.
colors:
  petal-pink: "#FFA2C8"
  butter-yellow: "#FFEBA5"
  warm-paper: "#F7F3EB"
  dusty-purple: "#797596"
  ink: "#231F2C"
  muted-ink: "#625D6E"
  white: "#FFFFFF"
  line: "#B3ADBE"
  success: "#197A52"
  danger: "#B42318"
typography:
  display:
    fontFamily: "Poppins, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "3.5rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Poppins, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "2rem"
    fontWeight: 750
    lineHeight: 1.15
    letterSpacing: "0"
  title:
    fontFamily: "Poppins, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "0"
  body:
    fontFamily: "Poppins, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "0"
  label:
    fontFamily: "Poppins, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0"
rounded:
  sm: "8px"
  md: "12px"
  pill: "999px"
spacing:
  xs: "6px"
  sm: "10px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.petal-pink}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "9px 14px"
    height: "40px"
  button-secondary:
    backgroundColor: "{colors.warm-paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "9px 14px"
    height: "40px"
  badge-available:
    backgroundColor: "{colors.butter-yellow}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "5px 9px"
  badge-reserved:
    backgroundColor: "{colors.dusty-purple}"
    textColor: "{colors.white}"
    rounded: "{rounded.pill}"
    padding: "5px 9px"
---

# Design System: Wantlist

## 1. Overview

**Creative North Star: "The Shared Gift Table"**

Wantlist should feel like a bright, organized table where people can place gift ideas, see what is available, and act without social friction. The system is a product UI first: familiar controls, readable forms, predictable lists, and restrained motion. The color palette brings a soft social pulse through pink, butter yellow, warm paper, and muted purple, while the interface stays light and simple so casual users can use it without visual fatigue.

The visual posture is optimistic, clean, and direct. Petal Pink carries primary actions, Warm Paper creates the page foundation, Butter Yellow gives friendly emphasis, and Dusty Purple handles reserved or structural states. The product rejects generic SaaS polish, heavy gradients, glass panels, and washed-out low-contrast pastels.

**Key Characteristics:**
- Familiar product controls with an approachable social tone.
- Bright palette used as state and hierarchy, not decoration.
- Rounded but not over-soft geometry, centered on 8px and 12px radii.
- Clear ownership, privacy, and reservation states.
- Light surfaces that do not tire the eye.

## 2. Colors

The palette is a soft social set: rose pink for action, pale yellow for friendly highlights, warm paper for the page background, and muted purple for reserved states and structure.

### Primary
- **Petal Pink** (`petal-pink`): The main action color. Use for primary buttons, selected states, important icons, and links that need product confidence.
- **Deep Ink** (`ink`): Primary text and icon color. Use instead of black so the palette stays gentle but readable.

### Secondary
- **Warm Paper** (`warm-paper`): The global page background, a very light yellow cream that keeps screens warm without becoming saturated.
- **Dusty Purple** (`dusty-purple`): The secondary structure and reserved-state color. Use for reserved badges, quiet icons, selected borders, and supporting interface chrome.

### Tertiary
- **Butter Yellow** (`butter-yellow`): A friendly highlight color. Use for available badges, small highlights, onboarding emphasis, copied/share success moments, or celebratory accents. Do not use it behind body text unless text contrast is verified.

### Neutral
- **White** (`white`): Card and control background when contrast against Warm Paper is needed.
- **Muted Ink** (`muted-ink`): Secondary text. It must remain dark enough for WCAG AA on white, Warm Paper, Butter Yellow, and purple-tinted surfaces.
- **Soft Line** (`line`): Borders and dividers. Use thin 1px strokes; avoid heavy outlines.
- **Success Green** (`success`): Confirmed success messages only.
- **Danger Red** (`danger`): Destructive and error states only.

### Named Rules
**The Petal Pink Rule.** Primary action and selected state use Petal Pink so users learn one confident action color.

**The Warm Paper Rule.** Warm Paper is the page background. Cards and controls may use white when they need clearer separation.

**The No Heavy Gradient Rule.** Purple gradients, glow, glassmorphism, and low-contrast pastel text are prohibited.

## 3. Typography

**Display Font:** Poppins with system fallbacks.
**Body Font:** Poppins with system fallbacks.
**Label/Mono Font:** Poppins with system fallbacks.

**Character:** Poppins gives the product a rounder, more social voice while staying familiar enough for forms, lists, and repeated product work. Weight, spacing, and hierarchy do the expressive work; the UI should not rely on decorative type.

### Hierarchy
- **Display** (800, 56px desktop / 40px mobile, 1 line-height): Home hero and major marketing-level statements only.
- **Headline** (750, 32px, 1.15 line-height): Page titles such as dashboard, public wishlist, settings, and auth screens.
- **Title** (700, 18px, 1.3 line-height): Panel headers, item names, and form section titles.
- **Body** (400, 16px, 1.55 line-height): Product copy, helper text, and list content. Keep prose near 65ch when possible.
- **Label** (700, 13px, 1.2 line-height): Form labels, compact metadata, and badge text.

### Named Rules
**The Product Sans Rule.** Do not introduce display fonts for labels, buttons, data, or navigation. Familiarity is the point.

**The No Whisper Text Rule.** Muted copy must stay readable. Never use pale gray or low-contrast pastel text on warm, yellow, pink, or purple-tinted surfaces.

## 4. Elevation

Wantlist is flat by default and uses tonal layering, borders, and spacing for depth. Shadows should be absent or extremely restrained; the product should feel light, not like floating SaaS cards. Hover states may shift background color, but they should not add large soft shadows.

### Shadow Vocabulary
- **None at rest** (`box-shadow: none`): Default for panels, cards, item rows, buttons, fields, and navigation.
- **Interactive lift, optional** (`box-shadow: 0 2px 8px rgba(16, 32, 51, 0.08)`): Allowed only for focused overlays or elevated temporary UI. Do not pair it with heavy borders.

### Named Rules
**The Tonal Depth Rule.** Use Warm Paper, white, Butter Yellow, Dusty Purple tints, and 1px lines to create depth before reaching for shadow.

## 5. Components

### Buttons
- **Shape:** Calm rounded rectangle (8px radius), minimum 40px height.
- **Primary:** Petal Pink background with Deep Ink text. Use for one primary action per local area: create, save, reserve, open important flow.
- **Hover / Focus:** Hover deepens the pink slightly. Focus must use a visible outline or ring with Petal Pink.
- **Secondary / Ghost:** Warm Paper or white background, Deep Ink text, Soft Line border, Dusty Purple tint hover fill.
- **Danger:** White background with Danger Red text and border. Use only for destructive actions.

### Chips
- **Style:** Pill radius with compact 5px 9px padding and bold 12px text.
- **Available:** Butter Yellow background and Deep Ink text.
- **Reserved:** Dusty Purple background and white text.
- **Neutral:** Warm Paper, white, or Dusty Purple tint background with Deep Ink text.

### Cards / Containers
- **Corner Style:** 8px for standard panels and item rows; 12px for the product showcase where imagery needs a softer frame.
- **Background:** White for cards, panels, followed wishlist cards, owned wishlist cards, and item rows. Warm Paper is the page base; Butter Yellow or Dusty Purple tints are reserved for empty states, hover feedback, and supporting surfaces.
- **Shadow Strategy:** No shadow at rest. Use borders and tonal fills.
- **Border:** 1px Soft Line. Never use thick colored side stripes.
- **Internal Padding:** 16px for compact cards, 22px-24px for panels, 10px-14px for dense item rows.

### Inputs / Fields
- **Style:** White or Warm Paper background, 1px Soft Line border, 8px radius, 11px 12px padding.
- **Focus:** Petal Pink border/ring with no layout shift.
- **Error / Disabled:** Danger Red text for errors; disabled controls use Dusty Purple tint fill and reduced opacity while staying legible.

### Navigation
- **Style:** Sticky top bar with Warm Paper or near-white background, 1px Soft Line divider, simple text brand, and familiar button controls.
- **Active / Hover:** Use Dusty Purple tint hover fills and Petal Pink for current or primary actions.
- **Mobile:** Navigation wraps into readable rows; no hidden mystery controls for core actions.

### Wishlist Item Row
- **Structure:** Fixed thumbnail, flexible item copy, status badge, then actions.
- **Behavior:** Long item names truncate with title support. Reservation state is always text plus color, never color alone. Selected/expanded rows stay white and use a stronger pink or purple-tinted border; tint fills appear only on hover.
- **Owner Actions:** Destructive icon buttons stay visually distinct but not oversized.

## 6. Do's and Don'ts

### Do:
- **Do** use Petal Pink for primary actions and selected controls.
- **Do** keep the page on Warm Paper and most cards white so the product remains light and easy on the eyes.
- **Do** keep wishlist cards and selected item cards white with visible contours; use Dusty Purple tints only for hover feedback on white controls and rows.
- **Do** pair every state color with text labels like "Disponível", "Reservado", "Seu", or "Privada".
- **Do** keep component geometry consistent: 8px radius for controls, 12px only for softer media containers.
- **Do** respect reduced motion; the showcase scroll may pause or become manually scrollable.

### Don't:
- **Don't** use generic SaaS purple gradients, decorative glow, or glassmorphism.
- **Don't** use low-contrast pastel text on pink, yellow, purple tint, or white backgrounds.
- **Don't** make Butter Yellow the default button color.
- **Don't** add thick side-stripe borders to cards, rows, alerts, or empty states.
- **Don't** invent unusual form controls, modals, or navigation patterns when standard product controls work.
