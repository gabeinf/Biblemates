/**
 * Placeholder layouts shown while data loads. Each screen skeleton mirrors the
 * real screen's structure so content swaps in without the page jumping.
 */
import { createContext, useContext, useEffect, useRef, type PropsWithChildren } from 'react';
import { Animated, ScrollView, StyleSheet, View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radii, spacing } from '../theme/tokens';

const PulseContext = createContext<Animated.Value | null>(null);

/** One shared animation so every bone on screen pulses in sync. */
function Pulse({ children }: PropsWithChildren) {
  const parent = useContext(PulseContext);
  const value = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    if (parent) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(value, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(value, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [parent, value]);
  if (parent) return <>{children}</>;
  return <PulseContext.Provider value={value}>{children}</PulseContext.Provider>;
}

type BoneProps = { width?: DimensionValue; height?: number; radius?: number; style?: StyleProp<ViewStyle> };

export function Bone({ width = '100%', height = 14, radius = radii.xs, style }: BoneProps) {
  const opacity = useContext(PulseContext) ?? 1;
  return <Animated.View style={[{ width, height, borderRadius: radius, backgroundColor: colors.Mat, opacity }, style]} />;
}

export function Lines({ count = 3, height = 12, last = '60%' }: { count?: number; height?: number; last?: DimensionValue }) {
  return (
    <View style={{ gap: spacing.xs }}>
      {Array.from({ length: count }, (_, i) => (
        <Bone key={i} height={height} width={i === count - 1 ? last : '100%'} />
      ))}
    </View>
  );
}

function SkeletonCard({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return <View style={[styles.card, style]}>{children}</View>;
}

/** Avatar + two lines — used for activity, reflections, members. */
export function RowSkeleton({ count = 3, avatar = 32 }: { count?: number; avatar?: number }) {
  return (
    <Pulse>
      <View style={{ gap: spacing.md }}>
        {Array.from({ length: count }, (_, i) => (
          <View key={i} style={styles.row}>
            <Bone width={avatar} height={avatar} radius={avatar / 2} />
            <View style={{ flex: 1, gap: spacing.xs }}>
              <Bone width="70%" height={13} />
              <Bone width="40%" height={10} />
            </View>
          </View>
        ))}
      </View>
    </Pulse>
  );
}

export function CardSkeleton({ lines = 3, button = true }: { lines?: number; button?: boolean }) {
  return (
    <Pulse>
      <SkeletonCard>
        <Bone width="35%" height={10} />
        <Bone width="65%" height={24} />
        <Lines count={lines - 1} />
        {button && <Bone height={46} radius={radii.sm} style={{ marginTop: spacing.xs }} />}
      </SkeletonCard>
    </Pulse>
  );
}

export function HomeSkeleton() {
  return (
    <Pulse>
      <SafeAreaView style={styles.screen} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content} scrollEnabled={false}>
          <View style={styles.row}>
            <Bone width={40} height={40} radius={20} />
            <Bone width={160} height={10} />
          </View>
          <Bone width="80%" height={30} />

          {/* circle */}
          <SkeletonCard>
            <Bone width="40%" height={10} />
            <View style={[styles.row, { justifyContent: 'space-between' }]}>
              <View style={{ flexDirection: 'row' }}>
                {[0, 1, 2, 3].map((i) => (
                  <Bone key={i} width={36} height={36} radius={18} style={{ marginLeft: i ? -8 : 0, borderWidth: 2, borderColor: colors.surface }} />
                ))}
              </View>
              <Bone width={120} height={12} />
            </View>
            <View style={[styles.row, { justifyContent: 'space-between', marginTop: spacing.xs }]}>
              {Array.from({ length: 7 }, (_, i) => <Bone key={i} width={14} height={14} radius={7} />)}
            </View>
          </SkeletonCard>

          <CardSkeleton lines={2} />

          <Bone width="50%" height={22} />
          <RowSkeleton count={2} />

          <CardSkeleton lines={3} />
        </ScrollView>
      </SafeAreaView>
    </Pulse>
  );
}

export function VersesSkeleton() {
  const widths: DimensionValue[] = ['100%', '94%', '100%', '72%', '100%', '88%', '100%', '60%', '97%', '100%', '80%', '100%', '66%'];
  return (
    <Pulse>
      <View style={styles.content}>
        <Bone width="45%" height={32} style={{ marginBottom: spacing.sm }} />
        {widths.map((w, i) => (
          <Bone key={i} width={w} height={16} style={{ marginBottom: i % 3 === 2 ? spacing.sm : 0 }} />
        ))}
      </View>
    </Pulse>
  );
}

export function BibleSkeleton() {
  return (
    <Pulse>
      <SafeAreaView style={styles.screen} edges={['top']}>
        <View style={styles.toolbar}>
          <Bone width={110} height={18} />
          <Bone width={48} height={22} radius={radii.full} />
        </View>
        <VersesSkeleton />
      </SafeAreaView>
    </Pulse>
  );
}

export function StudySkeleton() {
  return (
    <Pulse>
      <SafeAreaView style={styles.screen} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content} scrollEnabled={false}>
          <Bone width="25%" height={10} />
          <SkeletonCard>
            <Bone width="45%" height={10} />
            <Bone width="60%" height={30} />
            <Lines count={2} />
            <View style={[styles.row, { justifyContent: 'space-between', marginTop: spacing.xs }]}>
              <Bone width={80} height={10} />
              <Bone width={90} height={10} />
            </View>
            <Bone height={6} radius={3} />
            <Bone height={46} radius={radii.sm} />
          </SkeletonCard>
          <View style={styles.row}>
            {[0, 1, 2, 3, 4].map((i) => <Bone key={i} width={64} height={30} radius={radii.full} />)}
          </View>
          <Bone width="45%" height={22} />
          <SkeletonCard>
            {[0, 1, 2].map((i) => (
              <View key={i} style={[styles.row, { paddingVertical: spacing.xs }]}>
                <Bone width={22} height={22} radius={11} />
                <View style={{ flex: 1, gap: spacing.xs }}>
                  <Bone width="55%" height={14} />
                  <Bone width="80%" height={10} />
                </View>
              </View>
            ))}
          </SkeletonCard>
          <Bone width="50%" height={22} />
          <SkeletonCard>
            <RowSkeleton count={2} avatar={36} />
          </SkeletonCard>
        </ScrollView>
      </SafeAreaView>
    </Pulse>
  );
}

export function NotificationPrefsSkeleton() {
  return (
    <Pulse>
      <SkeletonCard style={{ gap: spacing.lg }}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={styles.row}>
            <View style={{ flex: 1, gap: spacing.xs }}>
              <Bone width="50%" height={14} />
              <Bone width="85%" height={10} />
            </View>
            <Bone width={50} height={30} radius={15} />
          </View>
        ))}
      </SkeletonCard>
    </Pulse>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { padding: spacing.lg, gap: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
});
