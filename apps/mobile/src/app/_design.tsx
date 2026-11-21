import { useRef, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { Redirect } from 'expo-router'
import { palettes, space, ThemeProvider, useTheme, type PaletteName } from '../theme'
import {
  AppText,
  Card,
  CelebrationScaffold,
  ChunkyButton,
  EmptyState,
  LambView,
  PastureView,
  Pill,
  ProgressBar,
  ScreenScaffold,
  SeedIcon,
  Sheet,
  SpeechBubble,
  StatTile,
  StreakWeek,
  type DayState,
  type LambHandle,
} from '../components/ui'

const WEEK: DayState[] = ['done', 'done', 'done', 'done', 'today', 'future', 'future']

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <AppText variant="label" color="textSecondary">
        {title}
      </AppText>
      {children}
    </View>
  )
}

function Gallery({ onCelebrate }: { onCelebrate: () => void }) {
  const theme = useTheme()
  const pet = useRef<LambHandle>(null)
  return (
    <>
      <Section title="Buttons">
        <ChunkyButton label="Check in" onPress={onCelebrate} />
        <ChunkyButton label="Not now" variant="secondary" />
        <ChunkyButton label="Claim seeds" variant="reward" />
        <ChunkyButton label="Disabled" disabled />
        <ChunkyButton label="Loading" loading />
      </Section>
      <Section title="Pills">
        <View style={styles.row}>
          <Pill kind="streak" value={5} />
          <Pill kind="seed" value={120} />
          <Pill kind="friends" value="3/4" />
        </View>
      </Section>
      <Section title="Stat tiles">
        <View style={styles.row}>
          <StatTile kind="seed" label="Seeds" value="+12" icon={<SeedIcon size={22} />} />
          <StatTile kind="streak" label="Streak" value={5} />
          <StatTile kind="friends" label="Friends" value="3/4" />
        </View>
      </Section>
      <Section title="Card + progress + type">
        <Card>
          <AppText variant="label" color="textSecondary">
            Today&apos;s reading
          </AppText>
          <AppText variant="headline">John 3:1–21</AppText>
          <AppText variant="callout" color="textSecondary">
            3 of 4 friends have checked in
          </AppText>
          <ProgressBar value={0.75} label="3 of 4 friends checked in" />
        </Card>
        <AppText variant="scripture">For God so loved the world, that he gave his only begotten Son.</AppText>
      </Section>
      <Section title="Streak week + speech bubble">
        <StreakWeek days={WEEK} />
        <SpeechBubble>Tomorrow makes 5!</SpeechBubble>
      </Section>
      <Section title="Characters (placeholders)">
        <View style={styles.row}>
          <Pressable onPress={() => pet.current?.pet()} accessibilityLabel="Pet the lamb">
            <LambView view="front" petRef={pet} size={120} />
          </Pressable>
          <LambView view="side" size={72} />
          <LambView view="side" walking size={72} />
        </View>
        <View style={{ backgroundColor: theme.bg }}>
          <PastureView lambCount={7} />
        </View>
      </Section>
      <Section title="Empty state + sheet">
        <EmptyState headline="No prayer requests" body="Share what's on your heart." cta={{ label: 'Add request', onPress: () => undefined }} />
        <Sheet>
          <AppText variant="title">Meet your first lamb</AppText>
          <ChunkyButton label="Continue" />
        </Sheet>
      </Section>
    </>
  )
}

/** Dev-only kit gallery: every component and state, a palette switcher, and a mock "Check-in complete". */
export default function Design() {
  const [name, setName] = useState<PaletteName>('goldenHour')
  const [celebrating, setCelebrating] = useState(false)
  if (!__DEV__) return <Redirect href="/" />
  return (
    <ThemeProvider palette={name}>
      {celebrating ? (
        <CelebrationScaffold
          lamb={<LambView view="front" />}
          eyebrow="Day 5 of 7"
          headline="Faithful today!"
          body="John 3:1–21"
          tiles={[
            { kind: 'streak', label: 'Streak', value: 5 },
            { kind: 'friends', label: 'Friends', value: '3/4' },
            { kind: 'seed', label: 'Seeds', value: '+12', icon: <SeedIcon size={22} /> },
          ]}
          primary={{ label: 'Continue', onPress: () => setCelebrating(false) }}
        />
      ) : (
        <ScreenScaffold title="Design kit">
          <View style={styles.row}>
            {(Object.keys(palettes) as PaletteName[]).map((n) => (
              <ChunkyButton key={n} label={n} variant={n === name ? 'primary' : 'secondary'} onPress={() => setName(n)} style={styles.flex} />
            ))}
          </View>
          <Gallery onCelebrate={() => setCelebrating(true)} />
        </ScreenScaffold>
      )}
    </ThemeProvider>
  )
}

const styles = StyleSheet.create({
  section: { gap: space.sm },
  row: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-end' },
  flex: { flex: 1 },
})
