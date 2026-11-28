# ASSET_REQUEST: work order for the design agent (S0)

Source facts: `.rework/APP_BRIEF.md`. Stack is **Expo SDK 58** (dev build, not Expo Go). Rive runtime: data-binding (view model) API only, no legacy state-machine inputs. Deliver into `biblemates.riv` unless noted.

## Already built, not re-requested (where used)

| id                                    | used in                                                                                    |
| ------------------------------------- | ------------------------------------------------------------------------------------------ |
| `Intro`                               | `/onboarding/1` (first launch) and splash for returning users → Today                      |
| `Lamb` (front: idle / walk / pet)     | onboarding steps marked Y, success screens, empty states, Today speech-bubble moments      |
| `Lamb Side` (idle+graze / walk / pet) | Today pasture (one per circle member)                                                      |
| `Pasture` (golden hour)               | Today header scene                                                                         |
| `Seed` (idle / earn)                  | Seed pill + celebration tile, **only if the owner approves seeds (Q1)**. Otherwise unused. |

## Change requests to built assets

| id                   | change                                                                                                                                                                                                                                           | pri |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --- |
| `Intro`              | Re-bake line under "Meet your first lamb": current "Finish a reading and a new lamb joins your flock" doesn't match the app (a lamb = a circle member, not a reward). Proposed: "Read with friends and your flock grows." Same layout and timing | P0  |
| `Lamb`               | Add enum input `pose` = `idle \| happy \| sit \| sleep \| wave` (keep `walking`, `pet`). `sit` = missed-day, gentle, never sad-faced. `sleep` = night/empty. Same view model on `Lamb Side` where `sit` ≈ lie-down                               | P0  |
| `Lamb` / `Lamb Side` | Add a `tint` color input (0–3 palette slots) so each member's lamb has a small distinct marker (scarf/ear tag), 4-8 members visible                                                                                                              | P1  |
| `Pasture`            | Expose a `walkBounds` guide as data (already in tokens) and an optional `sheepfold` "+N" text input for overflow                                                                                                                                 | P1  |

## Animations (new)

| id                                 | screen/moment                                                     | beats + timing                                                                                               | lamb     | inputs (type + name)                                             | events back        | size pt | loop/one-shot         | reduce-motion fallback           | pri |
| ---------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | -------- | ---------------------------------------------------------------- | ------------------ | ------- | --------------------- | -------------------------------- | --- |
| `Celebrate`                        | Check-in complete (`CelebrationScaffold`, after "mark day done")  | 0ms lamb hops (front) → confetti burst 120ms → lamb settles with ear flap → soft confetti loop               | front    | trigger `cheer`; bool `reduceMotion`                             | `settled` (≈700ms) | 390×360 | one-shot then 4s loop | static lamb `happy`, no confetti | P0  |
| `Celebrate-Study`                  | Whole circle finished the study (`milestone`)                     | flock of lambs hops in a row, banner-ribbon pops, confetti                                                   | front ×3 | trigger `cheer`; number `lambCount` (1–8); bool `reduceMotion`   | `settled`          | 390×420 | one-shot              | static row of lambs              | P1  |
| `Flame`                            | Streak extended screen + streak pill (only if Q1 allows a streak) | flame lights 0→200ms, number pop, tiny embers; idle flicker loop                                             | none     | trigger `ignite`; number `days`; bool `lit`                      | —                  | 160×160 | one-shot + loop       | static lit flame                 | P1  |
| `Nudge`                            | Nudge sent / received sheet                                       | lamb holds a rose heart, heart floats up and fades (sent) · lamb receives it and blushes (received)          | front    | trigger `send`; trigger `receive`; bool `reduceMotion`           | `done`             | 300×260 | one-shot              | static lamb + heart              | P1  |
| `Lamb-Arrive`                      | New member joined: lamb walks in along the path to a rest point   | uses `Lamb Side` walk; **app drives movement**. Need only a `pet` on arrival + a one-frame `sparkle` trigger | side     | trigger `sparkle`                                                | —                  | 440×300 | one-shot              | lamb appears with fade           | P2  |
| `Pledge`                           | Onboarding 14 Commitment (unbuilt): press-and-hold to sign        | hold fills a paw-print/stamp over 1.2s, stamp thumps, lamb `happy`                                           | front    | number `progress` 0–1 (app sets while holding); trigger `commit` | `stamped`          | 360×300 | one-shot              | static stamp on release          | P2  |
| `Loading-Lamb`                     | Replaces `Loading`/`ErrorState` spinners in non-form screens      | small lamb trots in place                                                                                    | side     | bool `sad` for error                                             | —                  | 120×90  | loop                  | static lamb                      | P2  |
| `Pasture-Morning`, `Pasture-Night` | Today header by time of day                                       | same layout/beats as `Pasture`, new palette; night uses navy sky + moon, lambs `sleep` allowed               | n/a      | same as `Pasture`                                                | —                  | 390×560 | ambient loop          | static frame                     | P2  |

## Icons

SF Symbols for chrome (rendered natively); custom only for brand moments.

| id                                                                                                    | where                        | meaning                    | states           | size pt                            | SF Symbol or custom                                                                        |
| ----------------------------------------------------------------------------------------------------- | ---------------------------- | -------------------------- | ---------------- | ---------------------------------- | ------------------------------------------------------------------------------------------ |
| tab-today                                                                                             | tab bar                      | Today (home)               | default/selected | 24–28                              | `sun.horizon` / `sun.horizon.fill`                                                         |
| tab-bible                                                                                             | tab bar                      | Bible                      | default/selected | 24–28                              | `book` / `book.fill`                                                                       |
| tab-study                                                                                             | tab bar                      | Study                      | default/selected | 24–28                              | `leaf` / `leaf.fill`                                                                       |
| pill-friends                                                                                          | Today header pill            | friends checked in         | default          | 20                                 | `person.2.fill`                                                                            |
| pill-streak                                                                                           | Today pill + CEL             | streak (only if Q1 yes)    | lit/unlit        | 20                                 | **custom** flame (character style)                                                         |
| pill-seed                                                                                             | Today pill                   | seeds (only if Q1 = seeds) | idle/earn        | 20                                 | **custom** = `Seed` artboard (built)                                                       |
| chat                                                                                                  | Today header                 | Scripture chat             | default          | 24                                 | `bubble.left.and.bubble.right`                                                             |
| pray                                                                                                  | encourage chips, prayer rows | "I prayed for you"         | default/done     | 20                                 | `hands.sparkles` / `hands.sparkles.fill`                                                   |
| heart                                                                                                 | reflections, nudges          | encouraged                 | default/done     | 20                                 | `heart` / `heart.fill` (rose)                                                              |
| check                                                                                                 | done states                  | day done                   | —                | 20                                 | `checkmark.circle.fill`                                                                    |
| add                                                                                                   | prayer list                  | new prayer request         | —                | 24                                 | `plus.circle`                                                                              |
| bookmark/highlight/note                                                                               | Bible reader, verse sheet    | existing actions           | on/off           | 22                                 | `bookmark(.fill)`, `highlighter`, `note.text`                                              |
| share                                                                                                 | invite                       | invite code share          | —                | 22                                 | `square.and.arrow.up`                                                                      |
| app-icon                                                                                              | home screen, App Store       | brand                      | —                | 1024 + Android adaptive fg/bg/mono | **custom**: front lamb face on navy `#243E69`; current icon/background is yellow `#F7C341` |
| splash-native                                                                                         | before Rive Intro            | brand                      | —                | none                               | color only `#243E69`, no image (set in app.json)                                           |
| Custom icons: rounded, 2.5px `#2B1C16` outline at 24pt, palette fills; deliver as SVG + 1x/2x/3x PNG. |

## Illustrations / empty states

| screen                                                                                                      | moment                                      | lamb pose                                                                                                  |
| ----------------------------------------------------------------------------------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Today                                                                                                       | no circle members besides me (invite card)  | front `wave`, small                                                                                        |
| Today                                                                                                       | no active study                             | front `idle` + "Choose a journey"                                                                          |
| Today                                                                                                       | missed day (kind)                           | front/side `sit`                                                                                           |
| Today                                                                                                       | whole flock read today (banner)             | side `pet`                                                                                                 |
| Study                                                                                                       | no study chosen (`choose a journey`)        | front `idle`                                                                                               |
| Study                                                                                                       | study complete (replaces hero)              | front `happy`                                                                                              |
| Prayer list                                                                                                 | no open requests                            | front `idle`, praying hands optional                                                                       |
| Activity                                                                                                    | nothing yet today                           | side `idle` graze                                                                                          |
| Chat                                                                                                        | empty conversation                          | front `idle`                                                                                               |
| Chat history                                                                                                | no chats                                    | front `sleep`                                                                                              |
| Circle setup                                                                                                | create/join header                          | front `wave`                                                                                               |
| Onboarding 2 (Hook)                                                                                         | two-panel "week 1 vs week 3"                | already designed by app; **request** a lamb-based pair (together vs drifting apart) if capacity allows, P2 |
| Onboarding 6, 7, 9, 13, 15, 16, 17                                                                          | front lamb on hill (feet 195,470, scale .8) | per step: 6 `idle`, 7 `idle`, 9 `wave`, 13 `idle`, 15 `wave`, 16 `happy`, 17 `idle`                        |
| Error (network)                                                                                             | non-form screens only                       | `Loading-Lamb` with `sad`                                                                                  |
| Never: while reading Scripture, settings, forms, form errors, or more than one animated lamb in a list row. |

**Placeholder slots shipped in #111 (swap list for S4).** Both slots render the static front lamb (`LambView view="front"`) with no pose, because `Lamb.pose` does not exist yet. When the `pose` input lands, pass it by state:

| screen / code                                                         | state                                                 | pose needed |
| --------------------------------------------------------------------- | ----------------------------------------------------- | ----------- |
| Study (`(tabs)/study.tsx`, 120pt front lamb above "Choose a journey") | no study chosen                                       | `idle`      |
| Study (same slot, "You finished ...!")                                | study completed                                       | `happy`     |
| Circle setup (`circle-setup.tsx`, choose mode only; hidden in forms)  | create/join header (keyboard layout must stay intact) | `wave`      |

**Placeholder slots (chat and prayer empty states).** Static front lamb (`LambView view="front"`), no pose yet:

| screen / code                                                 | state                                  | pose needed |
| ------------------------------------------------------------- | -------------------------------------- | ----------- |
| Chat (`(main)/chat.tsx`, 120pt, collapses with the keyboard)  | empty conversation (above the welcome) | `idle`      |
| Chat history (`(main)/chat-history.tsx`, `EmptyState`, 140pt) | no chats                               | `sleep`     |
| Today prayer list (`(tabs)/home.tsx`, 96pt)                   | no open requests (not the prayer form) | `idle`      |

**Placeholder slot (missed-day, kind).** Static side lamb (`LambView view="side"`, 48pt) in the "Welcome back" banner on Today (`(tabs)/home.tsx`, shown when yesterday's reading is unread and today's is not). Needs the `sit` pose; please keep it calm (no sad face).

Accessibility note for the design agent: the lamb is exposed as one image labelled "A lamb"; the Rive swap must keep that single label and not add focusable children. Pills cap Dynamic Type at 1.3x, so no asset change is needed for large text.

## Time of day

| screen                                                                                                                                | morning                      | golden hour (built, default)                   | night                                   |
| ------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- | ---------------------------------------------- | --------------------------------------- |
| Today pasture                                                                                                                         | `Pasture-Morning` (P2)       | `Pasture`                                      | `Pasture-Night` (P2, lambs may `sleep`) |
| Celebrations                                                                                                                          | no change (golden backdrop)  | default                                        | no change                               |
| Onboarding / Intro                                                                                                                    | no change: fixed golden hour | default                                        | no change                               |
| Everything else                                                                                                                       | n/a                          | light mode only until the night palette exists | n/a                                     |
| Selection rule: local hour 5–10 morning, 10–18 golden hour (visual default), 18–5 night. Until the P2 sets exist, golden hour always. |

## Intro scene is blurry on device (P0, from the 2026-11-21 phone test)

`apps/mobile/assets/scenes/intro-landed.png` is 390x844 (1x). A 440x956 phone at 3x needs 1320x2868, so the scene is upscaled ~3.4x and looks soft. Needed: `intro-landed@2x.png` (780x1688) and `intro-landed@3x.png` (1170x2532), same art, keep the cream sheet baked into the bottom and the lamb in the same place. Drop them next to the 1x file; `require('...intro-landed.png')` picks the right one with no code change. Better: export the scene without the baked sheet (the app draws its own `Sheet`).

## Growth loop (3 tabs: Pasture, Today, Study)

Product change: finishing the guided session plants a plant of the chosen species. The Pasture shows one tile per member and study day. Species unlock by spending Seeds (server-authoritative; the seed ledger exists, #135). State is derived, never stored: withered = past day not completed. Until this art lands the app ships placeholders (Ionicons, Views, existing PNGs), so every id below is swappable by file name with no code change. Style: same as `Lamb` (rounded, 2.5px `#2B1C16` outline, palette fills). Deliver each as SVG + 1x/2x/3x PNG with transparent background unless noted.

### Plant species (6 species x 4 growth stages + 2 shared states)

Species slugs are working names; the design agent may rename, but the app needs exactly 6 and a stable slug each. Suggested set: `wheat`, `olive`, `fig`, `vine`, `lily`, `cedar` (all in Scripture). The first species is free (default); the other 5 unlock for Seeds, so make them read as a rising-value ladder.

| id                  | where                            | meaning                                   | states / variants                                                                  | size pt | pri |
| ------------------- | -------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------- | ------- | --- |
| `plant-<species>-1` | Pasture tile, species picker     | stage 1 = seedling (planted today, small) | 6 species                                                                          | 96x96   | P0  |
| `plant-<species>-2` | Pasture tile                     | stage 2 = sprout                          | 6 species                                                                          | 96x96   | P0  |
| `plant-<species>-3` | Pasture tile                     | stage 3 = young plant                     | 6 species                                                                          | 96x96   | P0  |
| `plant-<species>-4` | Pasture tile, finish celebration | stage 4 = fully grown                     | 6 species; keep silhouettes distinct at 48pt                                       | 96x96   | P0  |
| `plant-withered`    | Pasture tile                     | past day not completed (any species)      | one shared art, species-neutral dry stalk; gentle, never grim; no per-species tint | 96x96   | P0  |
| `plant-empty`       | Pasture tile                     | future day, nothing planted yet           | faint dotted soil ring or tiny mound outline, low contrast                         | 96x96   | P0  |

Total: 24 growth-stage plants + 2 shared. Stage 4 is also shown at 160pt on the species picker and celebration, so export those stage-4 arts at 3x of 160 (480x480 minimum). A locked species shows `plant-<species>-4` as a flat `#2B1C16` 30% silhouette (the app tints it; no extra file).

### Tiles, mound, grass board

| id                 | where         | meaning                                                          | states                                                                               | size pt     | pri |
| ------------------ | ------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ----------- | --- |
| `tile-grass`       | Pasture board | one board cell (member x study day); plants sit on it            | 3 variants (A/B/C) so adjacent tiles don't repeat; must tile seamlessly edge to edge | 64x64       | P0  |
| `tile-grass-today` | Pasture board | today's column marker (soft golden edge)                         | default                                                                              | 64x64       | P1  |
| `tile-mound`       | Pasture board | dirt mound shown the moment a session is finished, before growth | planted (static) + pop (one-shot, 400ms scale-in)                                    | 64x64       | P0  |
| `tile-board-edge`  | Pasture board | hedge/fence border around the whole board                        | top / bottom / left / right / 4 corners (8 pieces)                                   | 16 px strip | P2  |

The board is a grid of up to 8 members (rows) x the study's days (columns, scrolls horizontally). Cells render at 64pt; 3x export = 192x192.

### Lamb growth stages

The lamb grows as the member keeps showing up (derived from completed days, no storage). Same rig and poses as `Lamb` / `Lamb Side` (`idle`, `happy`, `sit`, `sleep`, `wave`, `walking`, `pet`) plus a `stage` input.

| id                 | meaning                                     | view model input                                             | notes                                                                                                                            | pri |
| ------------------ | ------------------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- | --- |
| `Lamb` `stage`     | 0 = lamb, 1 = young sheep, 2 = flock leader | enum/number input `stage` 0-2 on both `Lamb` and `Lamb Side` | lamb = built art; young = taller, slight wool; leader = bell collar + larger scale (1.15x) so the leader reads in a 8-lamb flock | P1  |
| `lamb-stage-badge` | Pasture member row, profile                 | static icon of each stage                                    | 3 images, 32x32, for places the Rive lamb is too heavy (lists)                                                                   | P2  |

### Effects

| id          | screen/moment                                     | beats + timing                                                | inputs                              | size pt | loop/one-shot | reduce-motion fallback | pri |
| ----------- | ------------------------------------------------- | ------------------------------------------------------------- | ----------------------------------- | ------- | ------------- | ---------------------- | --- |
| `fx-hearts` | encourage / nudge received on a tile or member    | 3 small rose hearts float up and fade over 900ms, slight sway | trigger `burst`; number `count` 1-5 | 96x96   | one-shot      | single static heart    | P1  |
| `fx-munch`  | lamb eats/munches a grown plant (day reward)      | lamb chews 3x, crumbs pop, tiny `happy` beat, 1.2s total      | trigger `munch` (on `Lamb Side`)    | 120x90  | one-shot      | static lamb `happy`    | P1  |
| `fx-grow`   | stage changes on a tile (1->2->3->4)              | soft sparkle + 8% scale overshoot, 500ms                      | trigger `grow`; number `stage` 1-4  | 96x96   | one-shot      | cross-fade to new art  | P1  |
| `fx-wither` | tile flips to withered at day rollover (optional) | colour drains over 600ms, leaves droop                        | trigger `wither`                    | 96x96   | one-shot      | cross-fade to new art  | P2  |
| `fx-unlock` | species unlocked with Seeds                       | locked silhouette fills with colour, sparkle ring, 700ms      | trigger `unlock`                    | 160x160 | one-shot      | cross-fade             | P1  |

### Rive mood list for the chibi

The chibi (front `Lamb`) reacts to the chat mood the user picked. The 11 ids match `MOOD_IDS` in `packages/shared/src/scripture.ts` and are the exact strings for a `mood` enum input on `Lamb` (keep `pose` for the non-chat moments above). Each mood is a face + body hold of 1.5-2.5s that then returns to `idle`; never a sad or alarming face, always "present and gentle".

| mood id       | expression and body                                         |
| ------------- | ----------------------------------------------------------- |
| `anxious`     | wide soft eyes, small side-to-side sway, ears slightly back |
| `afraid`      | leans back a little, eyes wide, steadies and settles        |
| `sad`         | lowered head, half-closed eyes, a small blink, no tears     |
| `lonely`      | sits, looks to the side, ear tilts toward the user          |
| `overwhelmed` | eyes swirl once, deep breath (body swells then settles)     |
| `angry`       | brows down, firm stance, a slow exhale puff, no aggression  |
| `guilty`      | looks down and away, small bow, then looks up               |
| `doubting`    | head tilt, one ear up, one ear down, slow blink             |
| `hopeful`     | eyes up, ears lift, slight lean forward                     |
| `grateful`    | eyes closed smile, small bow, hearts optional (`fx-hearts`) |
| `joyful`      | hop, ears flap, big smile                                   |

Fallback if `mood` is unset or unknown: `idle`. Pose and mood are independent inputs; `mood` wins while set. Reduce motion: hold the final expression as a static frame. Priority P1 (placeholder: static front lamb).

### Placeholder slots (growth loop)

| screen / code            | placeholder today               | swaps to                                 |
| ------------------------ | ------------------------------- | ---------------------------------------- |
| Pasture tile (planted)   | Ionicons `leaf` sized by stage  | `plant-<species>-<stage>`                |
| Pasture tile (withered)  | Ionicons `leaf-outline`, muted  | `plant-withered`                         |
| Pasture tile (future)    | empty rounded View              | `plant-empty` on `tile-grass`            |
| Pasture board background | flat green View                 | `tile-grass` variants                    |
| Species picker           | Ionicons per species            | `plant-<species>-4`, locked = silhouette |
| Lamb on Pasture          | existing `LambView view="side"` | `Lamb Side` with `stage`                 |
