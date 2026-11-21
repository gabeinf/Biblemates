# Handoff (2026-11-21): onboarding fixes, next session start here

## Done
- PR #125 (merged): first attempt at the intro offset. Did NOT fix it on device.
- Branch `fix/intro-width-2` (verify passes, being pushed as the next PR): real fix. RN's `Image` takes its asset's size (390x844) as default width/height, which beats `left/right/top/bottom`, so `absoluteFill` did nothing. `IntroView.tsx` `styles.scene` now sets `width/height: '100%'`. Confirmed on Gabe's iPhone (440x956): debug showed img 390x844 before; he reports the page is now correct.
- Recon: `.rework/ONBOARDING_MAP.md`, `.rework/FIX_PLAN.md` (root causes for all 4 issues).

## New problem
Intro scene is slightly blurry: the PNG is 1x (390x844) upscaled to a 3x screen. Needs @2x/@3x art, added to `.rework/ASSET_REQUEST.md` (last section). Not fixable in code. Screenshots Gabe sent: `~/.t3/userdata/attachments/3e7536e3-9193-4858-a5a6-0eab72403236-c3ec8eb9-614f-44bd-8862-d6109a87e444.png` (before) and `...-a3515c63-755b-42e0-b1d5-b36258f2dc85.png` (stale-bundle state).

## Still open (see FIX_PLAN.md for causes and files)
1. Name screen (step 13): wide darker pill behind Continue = `pill` style passed to ChunkyButton's wrapper (lip is absolute full width). Sheep collapses to 0 with the keyboard by design (#117): ask Gabe: shrink, stay full, or leave.
2. Header (`onboarding/_layout.tsx`): make background transparent: needs the header overlaid on the Stack, step content padded under it.
3. Days picker (step 10): add a selection haptic in `WheelPicker.onScroll` when the index changes (add `haptic.select` using `Haptics.selectionAsync` to `components/ui/haptics.ts`).
4. Rive: no dependency or `.riv` exists; blocked on Gabe approving the dependency and delivering the file.

## How Gabe previews
Metro in the MAIN checkout: `cd ~/Desktop/Biblemates/apps/mobile && npx expo start --dev-client`. Edit in the main checkout on a feature branch (not a T3 worktree); Fast Refresh updates the phone. A reload can be sent with a ws message `{version:2,method:'reload'}` to `ws://localhost:8081/message`. Never commit to master; PR needs an issue (`Closes #N`); CI auto-merges.
Lesson: if a layout fix "does nothing", measure with `onLayout` on screen before guessing again.
