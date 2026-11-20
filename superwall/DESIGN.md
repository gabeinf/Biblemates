# Design system

Agents read this before building any paywall and keep it and `design/tokens.css` in sync: a
change to the brand changes both. Every paywall's `theme.css` imports `design/tokens.css` and
`design/base.css`, and shared components live in `components/`, imported as `@/components/<Name>`.

## Brand

Biblemates: warm and unhurried. Paper in light, a warm charcoal in dark, one gold accent, no
gradients for decoration, no shadows. The paywall reads like a well-set page of a devotional,
not an ad. Mirrors `apps/mobile/src/theme/tokens.ts` (paper, Ink, Gold).

## Colour

- `--color-bg` / `--color-fg`: paper (`#f3f2f2`) and ink (`#201f1d`) in light; a warm charcoal and
  paper in dark.
- `--color-surface`, `--color-raised`, `--color-muted`, `--color-secondary`: quiet steps of the
  foreground over the background, for panels and selected rows.
- Text ladder: `--color-fg`, `--color-fg-secondary` (body copy), `--color-fg-tertiary` (captions,
  secondary actions), `--color-fg-muted` (disabled, placeholders).
- `--color-border`: the one hairline, 10% of the foreground. `--color-border-strong` on hover.
- `--color-accent` (gold `#8c6911`, a brighter `#e0b04a` in dark) with `--color-accent-ink` on top:
  the primary action, the selected edge, the focused edge. Nothing else is gold.
- `--color-destructive` and `--color-success` (each with an `-ink`) only for outcomes.

## Type

- Cormorant Garamond (`--font-display`) for headings; Lora (`--font-body`) for everything else.
- Sizes: `--text-xs` (captions, links), `--text-sm` (body), `--text-base` (buttons), `--text-lg`
  (h3), `--text-xl` (h2), `--text-2xl` (h1, fluid).
- Weights 400 and 500 for body; headings are 600 with tight tracking (Cormorant runs small).

## Spacing and corners

- Spacing steps `--space-1` to `--space-8` (4px base). One step per relationship; the parent's
  gap owns it.
- One corner: `--radius-md` (10px) on every control and panel. `--radius-full` only for circles.
- Touch targets are at least 44px; the primary button is 52px tall and full width.

## Components

- `Button` (`components/Button.tsx`, `.button` in `design/base.css`): `variant="primary"` is the
  accent fill, used once per page; the default is the bordered secondary.
- `.link`: a quiet text action under the primary button (restore, terms).
- `.close`: the iOS close at the top right.
- `.notice`: one line of outcome copy above the actions.

## Voice

- Short, plain and specific. Say what the user gets, not how great it is.
- Sentence case everywhere, no exclamation marks, no emoji.
- Prices come from the product (`{price}`), never typed into copy.
- Failure copy says what happened and what to do next, in one line.

## Rules

- Never hard-code a colour, font, size, space or corner a token covers. Add a token instead.
- Change values in `design/tokens.css`; change how an element looks in `design/base.css`; add a
  shared component to `components/`. A paywall's `theme.css` holds only its own layout.
- A token change reaches every paywall on its next build, so check each one after changing it.
- Dark mode overrides colours only, under `:root.dark`.
- Do: one accent per page, flat surfaces, generous spacing. Don't: shadows, gradients for
  decoration, a second accent colour, more than one primary button on a page.
