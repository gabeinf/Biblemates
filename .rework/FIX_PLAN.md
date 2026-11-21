# Onboarding bug-fix plan (recon done; waiting for approval)

## Root causes
| # | Issue | Finding | Status |
|---|---|---|---|
| 1a | Rive doesn't play | No Rive anywhere: no dependency in `apps/mobile/package.json`, no `.riv` in repo, `~/.rive` holds only app telemetry (no assets). Intro is a static PNG (`IntroView.tsx:25`, `assets/scenes/intro-landed.png`), so "frozen" is expected. STATE.md: S4 is gated on a built `biblemates.riv` plus approval of the Rive runtime dependency. | confirmed, BLOCKED on asset + dependency approval |
| 1b | Intro shifted left, navy strip right | Not found by reading. Candidates: `IntroView.tsx` Image `flex:1` + `resizeMode=cover` inside `_layout.tsx` SafeAreaView (`edges=['left','right']` at step 1) while the Stack fades in; or window/scene width mismatch at cold launch. Recording can't be frame-inspected here (no ffmpeg). | **unconfirmed**; next: reproduce on device, log `onLayout` of the IntroView root vs `Dimensions.get('window')` |
| 2a | "White layer covers sheep" on name screen | Not a cover. `13.tsx:44-47` collapses the lamb slot to height 0 / opacity 0 as keyboard progress goes 0 -> 1 (shipped deliberately in #117) and the field autofocuses, so the sheep is always gone while typing. IMG_2261 confirms: no overlay, just no lamb. | confirmed; behaviour is by design, you want it changed |
| 2b | Wide darker pill behind Continue | Real layout bug. `13.tsx:136` `pill` (paddingHorizontal, borderRadius, minHeight) is passed as `style` to `ChunkyButton`, which applies it to its outer wrapper. Padding insets the face, but the lip is `position:absolute; left:0; right:0`, so the lip spans the full width behind the narrower face. | confirmed |
| 3 | Header opaque | The header has no background of its own. The opaque cream is `SafeAreaView` `backgroundColor: colors.paper` (`_layout.tsx:62`) plus Stack `contentStyle` paper, and the header is laid out in flow above the Stack, so scenes can't extend under it. Making it transparent needs the header absolutely positioned over the Stack with step content padded under it. | confirmed; "color mismatch" source (legacy `colors.paper` vs theme background) unconfirmed |
| 4 | No haptics on days picker | `WheelPicker.tsx` has none. `expo-haptics` is installed; util `haptic` in `components/ui/haptics.ts` only has `tap` (impact Light) and `success`. `commit()` (`:66`) only fires `onChange` when the value changes, but it runs on scroll END, not on each snap while scrolling. Per-snap needs a haptic where `onScroll` updates `index` (`:75`). | confirmed |

Haptics used today: ChunkyButton press-in (already haptic on every Continue, so no extra Continue haptic needed), IntroView landed, step 14 commit, celebrations.

## Sessions
| S | Scope | Files | Verify on device |
|---|---|---|---|
| S1 | Intro offset only (1b), after repro. Rive (1a) deferred until asset + dependency are approved | `IntroView.tsx`, maybe `_layout.tsx` | cold-launch 5x, no navy strip, both iPhone sizes |
| S2 | Name screen: fix lip bug (2b: apply width/radius to the face via a ChunkyButton prop, not wrapper padding); decide sheep behaviour (2a) | `13.tsx`, `ChunkyButton.tsx` (+ tests) | keyboard up/down, type a letter, check pill and layout |
| S3 | Transparent header (3) | `_layout.tsx`, maybe `StepScreen` padding | steps 3-19, no clipping over scenes, back button still white circle with border |
| S4 | Picker haptics (4): add `haptic.select` (`selectionAsync`) to `haptics.ts`, call it in `WheelPicker.onScroll` when `index` changes | `haptics.ts`, `WheelPicker.tsx` (+ test) | real device only, scroll slowly and fast |

## Decisions needed from you
1. Rive: approve adding the Rive runtime dependency, and say where the built `.riv` is (nothing exists yet). Otherwise 1a stays out of this pass.
2. 2a: pick one: (a) keep the sheep visible and smaller while typing (shrink instead of collapsing to 0), (b) keep sheep always at full size and let the screen scroll, (c) leave as is.
