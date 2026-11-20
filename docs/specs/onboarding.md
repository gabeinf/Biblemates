# Onboarding spec

What "done" means for each onboarding screen. Reference images live in
`design/reference/onboarding/NN-*.png` and show **structure only**. All copy below is
our own, and nothing here (brand, wording, illustrations, colors) comes from the references.

Copy in quotes is a draft. Tweak it freely, but keep the meaning.

## Flow at a glance

```
01 splash → 02 hook ─┬─ "Sign in" ───────────────────────────────→ /sign-in (existing)
                     └→ 03 intent → 04 proof → 05 voices → 06 rhythm → 07 stakes teaser
                        → 08 together → 09 fork ─┬─ "I have a code" → J join-code ─┐
                                                 └→ 10 days → 11 rules → 12 stakes │
                        ┌────────────────────────────────────────────────────────────┘
                        → 13 name → 14 commitment → 15 invite* → 16 rating → 17 notifications
                        → 18 source → 19 save progress → (main)/(tabs)
* 15 invite is skipped on the join-code path: they're already in a circle.
```

## Shared rules (apply to every screen)

- **Route:** step `N` lives at `apps/mobile/src/app/(auth)/onboarding/<N>.tsx` → `/onboarding/<N>`.
  The join branch is `/onboarding/join`.
- **Chrome:** steps 03–19 show the shared header: back button on the left and a progress bar
  that fills by step index. 01 and 02 have no header.
- **Primary button:** one full-width primary button pinned to the bottom safe area. It is
  disabled until the step's required input is valid.
- **State:** each step reads and writes the onboarding draft store (see wiring). Going back
  never loses an answer.
- **Theme:** colors, spacing and type come only from `theme/tokens.ts`. Reuse `components/`
  (`Button`, `StepScreen`, `StepHeading`, `ChoiceRow`, `TextField`, `FadeIn`, `BackButton`, `ProgressBar`)
  before adding new ones. Check `components/ui.tsx` and `components/onboarding*.tsx` first.
- **A11y:** every tappable has an accessible label and a hit area of at least 44pt.
  Selection cards expose `accessibilityState.selected`.
- **Screenshot:** `e2e/screens.spec.ts` captures each step as `artifacts/screenshots/onboarding-NN.png`.

---

## 01 · Splash

- **Purpose:** brand moment while fonts and session load.
- **Layout:** full-bleed background artwork (our own). Centred mark above a one-line verse in
  serif type that fades in word by word.
- **Inputs:** none.
- **Buttons:** none. Auto-advances.
- **Leads to:** a signed-in user with a finished onboarding goes to `(main)/(tabs)`. Everyone
  else goes to 02. Onboarding never resumes: closing the app starts it over.

**Acceptance**

- [ ] Shows for at least 1.2s and no more than 2.5s (min only applies once loading is done).
- [ ] Verse text animates in, and honors Reduce Motion (static text instead).
- [ ] Routes correctly for both cases: done, and everyone else (always 02, even mid-flow before the app closed).
- [ ] No back button or progress bar.
- [ ] Artwork is original and themed through tokens. No reference imagery.
- [ ] Reuses or replaces `AnimatedSplash` rather than duplicating it.

## 02 · Hook

- **Purpose:** name the problem: groups start reading together and drift apart.
- **Layout:** illustration card at the top: a two-panel "week 1 vs. week 3" scene. Two-line
  headline, with the second line in a muted tone. Supporting paragraph. Primary button
  and a sign-in link at the bottom.
- **Copy (draft):** "We all start the plan together… / and quietly drift apart." Body: "Weeks get
  full and the reading slips, but you still want to grow, and to grow alongside your people."
- **Inputs:** none.
- **Buttons:** primary "That's us" → 03. Link "Already have an account? Sign in" → `/sign-in`.
- **Leads to:** 03, or sign-in.

**Acceptance**

- [ ] Headline uses two tones, both from tokens.
- [ ] Illustration is original, with two panels and a clear before/after contrast.
- [ ] Primary button goes to `/onboarding/3`.
- [ ] Sign-in link goes to the existing sign-in screen.
- [ ] No header (no back button, no progress).
- [ ] Layout holds from a 375pt to a 430pt wide screen without clipping.

## 03 · Intent

- **Purpose:** learn why they came, to personalize the first study and later copy.
- **Layout:** serif headline, a short verse quote with its reference in small text, then 6–7
  selectable rows (icon, label, radio on the right). Primary button at the bottom.
- **Copy (draft):** "What's drawing you here?" Options: "I want a steady reading habit",
  "I want to feel closer to God", "I'm carrying something heavy", "Our marriage needs it",
  "I want peace in a busy season", "The Bible is hard for me to follow", "Something else".
- **Inputs:** single select (required).
- **Buttons:** "Continue" (disabled until a row is selected) → 04.

**Acceptance**

- [ ] Exactly one row can be selected, and tapping another row moves the selection.
- [ ] Selected row shows a filled check and an accent border/background.
- [ ] Continue is disabled with nothing selected.
- [ ] Choice is saved to the draft as `intent`.
- [ ] List scrolls if it overflows. Button stays pinned.
- [ ] Rows expose `selected` state to screen readers.

## 04 · Consistency proof

- **Purpose:** show that reading with others outlasts reading alone.
- **Layout:** two-tone headline. A chart card with two curves over ~12 weeks: "With your circle"
  stays high and "On your own" drops off. Each curve has an end label. A stat line and a
  caption sit below. The primary button is at the bottom.
- **Copy (draft):** "Read together, / keep going." Chart labels "With your circle" / "On your own".
  The stat must be real or clearly illustrative. Don't invent a percentage (open question).
- **Inputs:** none.
- **Buttons:** "Show me how" → 05.

**Acceptance**

- [ ] Chart draws with an animated stroke on enter (static under Reduce Motion).
- [ ] Both curves are labeled, and colors come from tokens.
- [ ] No unverifiable statistic ships. Use a placeholder flagged in code or a sourced number.
- [ ] Chart is built from native views or an existing dependency (ask before adding an SVG lib).
- [ ] Back returns to 03 with the selection intact.
- [ ] Progress bar advances.

## 05 · Voices (social proof)

- **Purpose:** reassurance from real people.
- **Layout:** star row, headline, subhead, then a vertically scrolling list of testimonial cards
  (avatar initial, title, stars, 2–4 line quote). The list fades under a pinned primary button.
- **Inputs:** none.
- **Buttons:** "Continue" → 06.

**Acceptance**

- [ ] Testimonials come from a single data file, not inline JSX. Ship placeholders
      until real, consented quotes exist (open question).
- [ ] No user counts or claims we can't back up.
- [ ] List scrolls under a pinned button with a fade mask at the bottom.
- [ ] Cards use the shared card style, and the avatar uses `Avatar`.
- [ ] Stars are decorative and hidden from screen readers. The card reads as "title, quote".

## 06 · Rhythm explainer

- **Purpose:** introduce the shared weekly reading goal.
- **Layout:** headline and subhead, then a card with a Mon–Sun grid showing two rows
  ("You", "Your circle"). Some days are checked. A footnote sits inside the card.
- **Copy (draft):** "Pick a weekly rhythm together" / "Choose how many days a week you'll read."
- **Inputs:** none (illustrative).
- **Buttons:** "Continue" → 07.

**Acceptance**

- [ ] Grid shows 7 day columns and 2 labeled rows.
- [ ] Checks animate in one after another (static under Reduce Motion).
- [ ] Day initials are locale-aware or at least come from a single constant.
- [ ] Card footnote explains that progress updates when a day's reading is marked done.
- [ ] Grid is not interactive and has no tap feedback.

## 07 · Stakes teaser

- **Purpose:** introduce friendly weekly stakes.
- **Layout:** an accent "This week's stakes" card with a big value ("Coffee on me") and a small
  "who owes whom" visual. Under it, a carousel-dot row cycles through example stakes
  (auto-advance). Headline and subhead sit below.
- **Copy (draft):** "Add a little friendly stakes" / "Something small keeps everyone showing up."
- **Inputs:** none.
- **Buttons:** "Continue" → 08.

**Acceptance**

- [ ] Card cycles through at least 3 example stakes about every 2s.
- [ ] Auto-cycling pauses under Reduce Motion.
- [ ] Examples come from the same list 12 uses.
- [ ] Card color is an accent token, not hard-coded.
- [ ] Stakes stay wholesome: no gambling language (see open questions).

## 08 · Together preview

- **Purpose:** show what the app looks like when the circle is active.
- **Layout:** fanned stack of 2–3 preview cards (a reflection or verse highlight from a member,
  using our own art). A "This week" card shows a progress bar per member and a streak chip.
  Headline and subhead sit below.
- **Copy (draft):** "Watch each other show up" / "It's easier to keep going when you're not alone."
- **Inputs:** none.
- **Buttons:** "Continue" → 09.

**Acceptance**

- [ ] "This week" card reuses existing progress and avatar components where possible.
- [ ] Shows at least 2 members with counts like "3/3" and a streak chip.
- [ ] Preview cards use sample content, with no real user photos.
- [ ] Subtle entrance animation that respects Reduce Motion.
- [ ] Fits on a 667pt-tall screen without overlapping the button.

## 09 · Payoff + fork

- **Purpose:** close the story ("…and keep going") and split creators from joiners.
- **Layout:** the "after" version of 02's illustration (both panels positive). Short label.
  Two-tone closing line. Two stacked buttons.
- **Copy (draft):** "We all start the plan together… / and keep going."
- **Inputs:** none.
- **Buttons:** secondary (outline) "I have an invite code" → `/onboarding/join`.
  Primary "Start a circle plan" → 10.

**Acceptance**

- [ ] Illustration mirrors 02's composition so the contrast reads.
- [ ] Two buttons: outline secondary above, filled primary below.
- [ ] Draft records `path: 'create' | 'join'`.
- [ ] Each button routes to the right next step.
- [ ] Back from 10 or join returns here.

## J · Join with code (branch, no reference image)

- **Purpose:** let an invited member join an existing circle.
- **Layout:** headline, a 6-character code field (auto-uppercase, monospace), helper text, and
  a primary button. Pasting a full invite link pulls the code out of it.
- **Inputs:** invite code (6 chars, required).
- **Buttons:** "Join circle" → validate the code and save the circle id to the draft → 13.
- **Note:** the actual `join_circle` RPC runs after sign-up in 19. Before auth we only show a
  preview lookup if one exists. Otherwise we validate the format and defer.

**Acceptance**

- [ ] Field auto-uppercases, accepts paste, and caps at 6 characters.
- [ ] Pasting an invite link fills in just the code.
- [ ] Invalid format shows an inline error, and the button stays disabled.
- [ ] Code is saved to the draft. Steps 10–12 and 15 are skipped on this path.
- [ ] After sign-up (19), `join_circle(code)` runs. If it fails, the error shows and the user can retry.
- [ ] Deep link `/onboarding/join?code=XXXXXX` prefills the field.

## 10 · Days per week

- **Purpose:** set the weekly reading goal.
- **Layout:** centred question and a vertical wheel picker (1–7) with the selected row framed
  between hairlines and a "days" suffix. Primary button, plus a "you can change this later" note.
- **Copy (draft):** "How many days a week will you read?"
- **Inputs:** integer 1–7, default 3.
- **Buttons:** "Continue" → 11.

**Acceptance**

- [ ] Picker snaps to values 1–7 and defaults to 3.
- [ ] Suffix reads "day" for 1 and "days" otherwise.
- [ ] Works with touch, mouse wheel (web) and screen-reader adjust actions.
- [ ] Saved to the draft as `daysPerWeek`.
- [ ] "You can change this later" note sits under the button.
- [ ] Built without a new dependency, or the dependency is approved first.

## 11 · Stakes rules

- **Purpose:** explain how stakes resolve each week.
- **Layout:** headline and subhead, then three outcome cards. Each card has a title, a colored
  one-line result, and a pair of You/Circle status badges (✓ or ✕).
- **Copy (draft):** "Both hit the goal → nobody owes." "One falls short → they owe the stakes."
  "Everyone misses → call it even and start fresh."
- **Inputs:** none.
- **Buttons:** "Choose your stakes" → 12.

**Acceptance**

- [ ] Three cards in that order, each with two labeled badges.
- [ ] Success, warning and neutral colors come from tokens.
- [ ] Badges carry text labels for screen readers ("You: hit", "Circle: missed").
- [ ] Copy covers groups of more than 2 (open question: rules for 3+ members).
- [ ] Button label differs from "Continue" and routes to 12.

## 12 · Stakes picker

- **Purpose:** choose this circle's weekly stakes.
- **Layout:** headline and subhead, then a 2-column grid of preset tiles (icon and label). The
  selected tile shows an accent border, a check and an edit pencil. Below the grid is a
  "Make your own" row (plus icon, title, example hint, chevron). Primary button and a "change later" note.
- **Presets (draft):** "Coffee on me", "I cook dinner", "Pray for you by name", "Handwritten note".
- **Inputs:** single select, or a custom text (max 40 chars).
- **Buttons:** "Continue" → 13. "Make your own" opens an inline sheet with a text field.

**Acceptance**

- [ ] Exactly one preset or custom value is selected, and Continue is disabled otherwise.
- [ ] Custom sheet validates 1–40 chars and then shows up as the selected tile.
- [ ] Pencil on the selected tile lets the user edit its label.
- [ ] Saved to the draft as `stakes: { kind: 'preset' | 'custom', label }`.
- [ ] Grid wraps cleanly on narrow screens.
- [ ] Presets are shared with 07's teaser.

## 13 · Name

- **Purpose:** what the circle calls them.
- **Layout:** centred question, small hint, a single underlined text field with centred text,
  and a compact pill button directly under the field so it stays above the keyboard.
- **Copy (draft):** "What should your circle call you?" Hint: "A first name or nickname is perfect."
- **Inputs:** display name, 1–30 chars, trimmed.
- **Buttons:** "Continue" → 14. The keyboard's return key also submits.

**Acceptance**

- [ ] Field autofocuses and the keyboard opens on enter.
- [ ] Button is disabled while the trimmed value is empty.
- [ ] Button stays visible above the keyboard on iOS and Android.
- [ ] `autoCapitalize="words"` and `textContentType="givenName"`.
- [ ] Saved to the draft as `displayName`, and later written to `profiles` in 19.
- [ ] Return key submits.

## 14 · Commitment

- **Purpose:** a small ritual where they sign a commitment to show up for their circle.
- **Layout:** headline and subhead, a rounded signature pad, a "Clear" link under it, a
  primary button with a trailing arrow, and a small caption.
- **Success state:** on finish the screen blurs, a circular check badge scales in with a soft
  glow, and then the flow advances (reference `IMG_2199`).
- **Copy (draft):** "Make it official" / "A promise to show up, for them and for you." Button "I'm in".
- **Inputs:** signature strokes (required, at least 1 stroke of reasonable length).
- **Buttons:** "Clear" resets the pad. "I'm in" → success animation → 15 (or 16 on join).

**Acceptance**

- [ ] Pad captures strokes smoothly using gesture-handler and reanimated (already installed).
- [ ] Button is disabled until a stroke of meaningful length exists.
- [ ] "Clear" empties the pad and disables the button.
- [ ] Success overlay shows for about 900ms and then routes on.
- [ ] Haptic tick on success (where supported).
- [ ] The pad doesn't scroll the page while drawing.
- [ ] Signature is not uploaded. We only store `committedAt` in the draft.

## 15 · Invite your circle

- **Purpose:** get at least one other person in. The app only works with others.
- **Layout:** headline and subhead. The OS share sheet opens automatically over the screen with
  a prefilled message containing the invite link and code. When the sheet closes, the screen
  shows the code, a "Share again" button, a "Copy code" button and "Continue".
- **Copy (draft):** "Biblemates is better together" / "Invite your circle now."
- **Inputs:** none.
- **Buttons:** "Share invite" (re-open the sheet), "Copy code", and "Continue" → 16.
- **Note:** a circle and code need an account. Generate a provisional code locally, or create
  the circle after 19 and send the invite then (open question).

**Acceptance**

- [ ] Share sheet opens on enter with a prefilled message and link.
- [ ] Code is visible on screen after the sheet closes.
- [ ] "Copy code" uses `expo-clipboard` and shows a confirmation.
- [ ] Continue works whether or not they shared. Sharing is never a hard gate.
- [ ] Draft records `invitedAt` when the share completes.
- [ ] Skipped on the join path.

## 16 · Rating ask

- **Purpose:** a warm, personal request for a store rating.
- **Layout:** headline, two short lines from the team in a personal voice, a circular original
  illustration, and the primary button. The native review prompt appears on tap.
- **Inputs:** none.
- **Buttons:** "Continue" triggers the native review request (where available) → 17.

**Acceptance**

- [ ] Native review prompt is requested at most once per install.
- [ ] Web and unsupported platforms skip the prompt and still advance.
- [ ] Copy is our own team's voice with no borrowed story.
- [ ] Illustration is original.
- [ ] Needs `expo-store-review`, so ask before adding it.

## 17 · Notifications

- **Purpose:** pre-prompt before the OS permission dialog.
- **Layout:** headline and subhead. The OS permission dialog shows centred on the screen, with
  a pointing hint toward "Allow".
- **Copy (draft):** "Know when your circle reads" / "Small nudges that keep you in step."
- **Inputs:** OS permission choice.
- **Buttons:** on enter, request permission through `expo-notifications`. Either answer → 18.

**Acceptance**

- [ ] Permission is requested once on enter. If already granted or denied, skip straight to 18.
- [ ] Allow and Don't Allow both advance.
- [ ] Result saved to the draft. The push token registers after sign-up in 19.
- [ ] Web shows the screen with a "Continue" button and no prompt.
- [ ] Pointer hint animates gently and respects Reduce Motion.

## 18 · Referral source

- **Purpose:** attribution.
- **Layout:** headline and small subhead, then 6 selectable rows (icon, label, radio). The row
  order is shuffled per user, with "Other" always last. Primary button is disabled until a row is
  chosen (empty state: reference `IMG_2198`).
- **Options (draft):** "Church or small group", "Friend or family", "Instagram", "TikTok",
  "App Store search", "Other".
- **Inputs:** single select (required). "Other" shows an optional free-text field.
- **Buttons:** "Continue" → 19.

**Acceptance**

- [ ] Order is randomized once per session, with "Other" pinned last.
- [ ] Single select with accent selected state, and Continue disabled until chosen.
- [ ] "Other" reveals an optional text field (max 60 chars).
- [ ] Saved to the draft as `source`.
- [ ] Brand icons only where we're licensed. Otherwise use generic icons.

## 19 · Save progress (sign up)

- **Purpose:** create the account and commit everything from the draft.
- **Layout:** a top-right "Have an invite code?" chip (opens the join field inline if they skipped
  it), a centred headline, stacked "Continue with Apple" / "Continue with Google" / "Continue with
  email" buttons, and a privacy note at the bottom.
- **Copy (draft):** "Save your plan" / "Your data stays private."
- **Inputs:** auth choice, with email and password on the email path (reuse step-2 form logic).
- **Buttons:** each provider → auth → write the draft (profile name, circle create or join,
  goal, stakes, intent, source, push token) → `(main)/(tabs)`.

**Acceptance**

- [ ] Email path reuses the existing validation (`isEmail`, `MIN_PASSWORD`) and Supabase auth.
- [ ] Apple and Google buttons render, and a provider not configured yet is hidden behind a flag.
- [ ] On success, the draft is written in one service call, and a failure leaves the user on this screen with an error.
- [ ] Join path runs `join_circle`. Create path creates the circle with goal and stakes.
- [ ] The draft is cleared after a successful write.
- [ ] Invite-code chip works when no code was entered earlier.
- [ ] Lands on `(main)/(tabs)` with the circle visible.

Note: the draft lives in memory only (see "Flow wiring + persistence"), so it must be written
in the same app session as sign-up. If email confirmation sends the user out of the app, or a
web OAuth redirect reloads the page, the draft is gone. #23 must handle this (for example,
write the draft during `signUp`, or skip email confirmation for this flow).

---

## Flow wiring + persistence

- **Purpose:** make the steps one flow. Answers last for the app session only.
- **Scope:** route migration from `(onboarding)/step-N` to `onboarding/<N>`, shared header with
  step-indexed progress, a typed onboarding draft (Zod schema in `packages/shared`) held in
  memory, branch handling (create vs. join), and the final write in 19. The draft is not
  saved to disk: closing the app mid-flow starts onboarding over at 01.

**Acceptance**

- [ ] Draft type comes from the schema in `packages/shared`.
- [ ] Killing the app mid-flow and reopening starts over at 01 → 02 with an empty draft.
  ("Starts over" is about app launch. Opening a step URL directly, by deep link or web reload,
  shows that step with an empty draft.)
- [ ] Progress bar is computed from the active path, so the join path's progress stays monotonic.
- [ ] Back navigation works from every step, and Android hardware back matches.
- [ ] Old `step-1`/`step-2` routes are removed, with no dead links (`index.tsx`, sign-in links).
- [ ] Unit tests cover draft reducers and next-step resolution for both paths.
- [ ] `e2e/screens.spec.ts` captures every numbered step.

## Paywall placement

- **Purpose:** decide where, and whether, a paywall appears. Reference `IMG_2212` shows a
  plan-picker paywall (3 plan rows, the selected one outlined, savings badges, a feature
  checklist, and Terms / Privacy / Restore links) shown after onboarding, on top of the home screen.
- **Decision (placement):** the paywall appears **once, after the user's first completed reading**.
  It never appears during the 01 to 19 flow (never between 01 and 19), not right after 19, and not
  on a gated feature.
- **Form:** a dismissible full-screen sheet with a close button. Closing it returns the user to
  where they were, with nothing locked by that act alone.
- **Completed reading (defined):** the first successful "Mark Day N as read" in the Bible tab
  (`useMarkDayComplete`). The "shown" flag is stored on the device, so the sheet opens once per device.
- **Plans:** rows are single select, with the selected row outlined. Savings badges are computed
  from the store prices (for example, the per-period price of a longer plan against the shortest
  one), never typed in. Prices always come from the store, never hard-coded. Terms, Privacy and
  Restore links all work. Reference `IMG_2212` is for structure only; copy, plan names and visuals
  are original.
- **Decided:** the IAP provider is RevenueCat (`react-native-purchases`). One yearly subscription,
  $39.99/year, configured in the store product. The store product has a 7-day free trial for new
  subscribers only. The app never hard-codes the price, trial length or dates: it shows the
  trial, timeline and "No payment due now" only when the package has a free intro offer and the
  user is intro-eligible, and counts the dates from today. The reminder step appears only when a
  local reminder notification is actually scheduled.
- **No key, no sheet:** (applies to our fallback sheet; Superwall paywalls are gated by the dashboard campaign) without `EXPO_PUBLIC_REVENUECAT_API_KEY` and `EXPO_PUBLIC_PRIVACY_URL`, or
  when no offering loads, the paywall never shows and never blocks the app.
- **Build:** tracked in issue #83.
- **Superwall (#86):** Superwall decides when and which paywall shows, via the placement
  `first_reading_completed`; RevenueCat stays the purchase backend and entitlement source. If
  Superwall skips or errors, the sheet above is the fallback.
- **Temporary:** while testing, step 19 also registers `onboarding_completed` right after sign-up.
  This breaks "never between 01 and 19" on purpose. Remove it (and the dashboard placement) before release.

**Acceptance**

- [x] Placement decision recorded in this spec.
- [x] Paywall dismissible (close button) unless the decision says otherwise.
- [x] Plan rows are single select, with the selected row outlined. Savings badges are computed, not typed in.
- [x] Terms, Privacy and Restore links work.
- [x] Never interrupts the flow between 01 and 19. (Temporarily broken by `onboarding_completed` at 19, see above.)
- [x] Prices come from the store and are never hard-coded.

---

## Reference images not numbered

| File           | What it is                                     | Why it isn't numbered                                  |
| -------------- | ---------------------------------------------- | ------------------------------------------------------ |
| `IMG_2197.PNG` | Notifications pre-prompt                       | Duplicate of 17 with a stray keyboard                  |
| `IMG_2198.PNG` | Referral source, nothing selected              | Empty-state variant of 18                              |
| `IMG_2199.PNG` | Commitment success overlay                     | Success state of 14                                    |
| `IMG_2206.PNG` | Welcome with Apple/Google/email and a carousel | Alternative to 02 + 19 (sign up first instead of last) |
| `IMG_2210.PNG` | Home: verse card, topic grid, ask bar          | Post-onboarding app, not a step                        |
| `IMG_2211.PNG` | Today tab: greeting, verse, Listen/Read        | Post-onboarding app, not a step                        |
| `IMG_2212.PNG` | Paywall                                        | See "Paywall placement"                                |

## Open questions

1. **Stakes for a Bible app:** keep friendly stakes (coffee, dinner, prayer, note) or swap them for
   something gentler like "encourage them by name"? Avoid money and gambling framing either way.
2. **Circles of 3+:** the references assume two partners. How do the 11 rules read for a circle of 5?
3. **Stats and testimonials (04, 05):** do we have real numbers or consented quotes? Until then,
   these ship as obvious placeholders.
4. **Invite before account (15):** create the circle server-side earlier (anonymous auth), or
   move invite after 19?
5. **New dependencies to approve:** `expo-store-review` (16), `expo-apple-authentication` (19),
   possibly an SVG lib for 04 and the 14 pad, and an IAP SDK (paywall).
