# Onboarding map (recon, bug-fix pass)

Stack: Expo SDK 58 / RN 0.88 / expo-router. Steps live in `apps/mobile/src/app/(auth)/onboarding/<n>.tsx` (src paths below are under `apps/mobile/src/`).

| Step | File | Notes |
|---|---|---|
| navigator + header | `app/(auth)/onboarding/_layout.tsx` | SafeAreaView > header row (BackButton, ProgressBar, spacer) ABOVE the `<Stack>` (fade). Header hidden on steps 1, 2 (`HEADERLESS` in `lib/onboarding-flow.ts:33`) |
| 01 intro "Meet your first lamb" | `app/(auth)/onboarding/1.tsx` -> `components/ui/IntroView.tsx` | static `assets/scenes/intro-landed.png` + `Sheet` + `ChunkyButton` |
| 02 "We all start the plan together" | `2.tsx` + `components/onboarding-together.tsx` | |
| 03 "What's drawing you here?" | `3.tsx` + `components/onboarding-choice.tsx` | |
| 10 days picker | `10.tsx` + `components/WheelPicker.tsx` | |
| 12 stakes sheet | `12.tsx` + `components/onboarding-stakes.tsx` | uses `KeyboardScreen` |
| 13 name | `13.tsx` | own KeyboardAwareScrollView, LambView collapses with keyboard |
| notifications "Know when your circle reads" | not confirmed which step number (check `lib/onboarding-flow.ts`, likely 16/17) | |

Shared: header `ProgressBar` (`components/ProgressBar.tsx`), `BackButton` (`components/onboarding.tsx:76`, styles `:186`), button = `Button` (`components/ui/legacy.tsx:38`) -> `ChunkyButton` (`components/ui/ChunkyButton.tsx`), keyboard footer `components/KeyboardScreen.tsx`, haptics util `components/ui/haptics.ts`, lamb `components/ui/LambView.tsx`.
Rive view wrapper: **none exists.**
