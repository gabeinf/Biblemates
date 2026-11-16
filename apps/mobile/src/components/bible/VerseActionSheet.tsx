import { useEffect, useRef, useState } from 'react';
import { Pressable, Share, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  LinearTransition,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { GestureDetector, ScrollView, usePanGesture } from 'react-native-gesture-handler';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { highlightColors, colors, radii, spacing, typography, type HighlightColor } from '../../theme/tokens';
import { formatRef } from '../../constants/books';
import type { BibleVerse } from '../../types/bible';

type Props = {
  verse: BibleVerse | null;
  highlight?: string;
  bookmarked: boolean;
  circleReflectionCount: number;
  onClose: () => void;
  onHighlight: (color: HighlightColor | null) => void;
  onBookmark: () => void;
  onPrivateNote: () => void;
  onShare: () => void;
  onViewReflections: () => void;
};

type ShownProps = Props & { verse: BibleVerse };

const SPRING = { damping: 20, stiffness: 220, mass: 0.8 };
/** Drag distance / fling speed (px, px/s) that commits a swipe. */
const DISMISS_DISTANCE = 60;
const EXPAND_DISTANCE = 30;
const FLING_VELOCITY = 700;

/**
 * Compact, non-modal footer shown while a verse is selected. No backdrop and no
 * shadow — the reader stays visible and scrollable behind it. The sheet tracks
 * the finger: drag down to dismiss (or collapse when expanded), drag up for the
 * secondary actions. Deselecting the verse from outside animates it out too.
 */
export default function VerseActionSheet(p: Props) {
  // Keep rendering the last verse (and its props) while the exit animation runs.
  const [mounted, setMounted] = useState(!!p.verse);
  const lastProps = useRef<ShownProps | null>(null);
  if (p.verse) lastProps.current = p as ShownProps;

  useEffect(() => {
    if (p.verse) setMounted(true);
  }, [p.verse]);

  const props = lastProps.current;
  if (!(mounted || p.verse) || !props) return null;
  return <Footer {...props} open={!!p.verse} onExited={() => setMounted(false)} />;
}

function Footer(p: ShownProps & { open: boolean; onExited: () => void }) {
  const ref = formatRef({ bookId: p.verse.bookId, chapter: p.verse.chapter, verseStart: p.verse.verse });
  const verseKey = `${p.verse.bookId}-${p.verse.chapter}-${p.verse.verse}`;
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  // Optimistic swatch so the tapped colour shows its check while the sheet leaves.
  const [pickedHighlight, setPickedHighlight] = useState<string | null | undefined>(undefined);
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, spacing.xs);

  /** Vertical offset of the sheet; 0 = resting, `hidden` = fully off-screen. */
  const offset = useSharedValue(1000);
  const hidden = useSharedValue(1000);
  const isExpanded = useSharedValue(false);
  const flingVelocity = useSharedValue(0);
  const laidOut = useRef(false);

  // A different verse tapped while open: reset to the compact state in place.
  useEffect(() => {
    setExpanded(false);
    isExpanded.value = false;
    setCopied(false);
    setPickedHighlight(undefined);
  }, [verseKey, isExpanded]);

  const onLayout = (e: LayoutChangeEvent) => {
    hidden.value = e.nativeEvent.layout.height + bottom + 24;
    if (laidOut.current) return;
    laidOut.current = true;
    // Enter: snap below the screen, then spring up.
    offset.value = withSequence(withTiming(hidden.value, { duration: 0 }), withSpring(0, SPRING));
  };

  // Exit: slide out from wherever the sheet currently is (mid-drag included).
  // Re-opened mid-exit: spring back, which cancels the exit before onExited fires.
  useEffect(() => {
    if (p.open) {
      flingVelocity.value = 0;
      if (laidOut.current) offset.value = withSpring(0, SPRING);
      return;
    }
    if (!laidOut.current) return p.onExited();
    const onExited = p.onExited;
    const remaining = Math.max(hidden.value - offset.value, 0);
    const speed = Math.max(flingVelocity.value, 1100);
    offset.value = withTiming(
      hidden.value,
      { duration: Math.min(Math.max((remaining / speed) * 1000, 120), 260), easing: Easing.out(Easing.quad) },
      (finished) => {
        if (finished) scheduleOnRN(onExited);
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.open]);

  const setExpandedJS = (next: boolean) => {
    isExpanded.value = next;
    setExpanded(next);
  };

  const onClose = p.onClose;
  const pan = usePanGesture({
    // Only claim clearly vertical drags so the horizontal action row still scrolls.
    activeOffsetY: [-10, 10],
    failOffsetX: [-12, 12],
    enabled: p.open,
    onUpdate: (e) => {
      'worklet';
      const dy = e.translationY;
      // Follow the finger downwards; resist upwards so it feels anchored.
      offset.value = dy > 0 ? dy : dy * 0.25;
    },
    onDeactivate: (e) => {
      'worklet';
      const dy = e.translationY;
      const vy = e.velocityY;
      const up = dy < -EXPAND_DISTANCE || vy < -FLING_VELOCITY;
      const down = dy > DISMISS_DISTANCE || vy > FLING_VELOCITY;

      if (down && !isExpanded.value) {
        flingVelocity.value = Math.max(vy, 0);
        scheduleOnRN(onClose);
        return;
      }
      if (down && isExpanded.value) scheduleOnRN(setExpandedJS, false);
      else if (up && !isExpanded.value) scheduleOnRN(setExpandedJS, true);
      offset.value = withSpring(0, { ...SPRING, velocity: vy });
    },
  });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.value }],
    opacity: interpolate(offset.value, [0, hidden.value], [1, 0.6], 'clamp'),
  }));

  const copy = async () => {
    await Clipboard.setStringAsync(`“${p.verse.text.trim()}” — ${ref}`);
    setCopied(true);
    setTimeout(p.onClose, 700);
  };

  const shareExternally = () => {
    Share.share({ message: `“${p.verse.text.trim()}” — ${ref}` });
  };

  const pickHighlight = (c: HighlightColor | null) => {
    setPickedHighlight(c);
    p.onHighlight(c);
  };

  const activeHighlight = pickedHighlight !== undefined ? pickedHighlight : p.highlight;

  return (
    <Animated.View
      style={[styles.wrap, { bottom }, sheetStyle]}
      pointerEvents={p.open ? 'box-none' : 'none'}
      onLayout={onLayout}
    >
      <GestureDetector gesture={pan}>
        <Animated.View style={styles.sheet} layout={LinearTransition.springify().damping(SPRING.damping).stiffness(SPRING.stiffness)}>
          <Pressable onPress={() => setExpandedJS(!expanded)} hitSlop={10} style={styles.handleHit}>
            <View style={styles.handle} />
          </Pressable>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actions}>
            <View style={styles.swatchGroup}>
              {(Object.keys(highlightColors) as HighlightColor[]).map((c) => {
                const active = activeHighlight === c;
                return (
                  <Pressable
                    key={c}
                    accessibilityLabel={`Highlight ${c}`}
                    onPress={() => pickHighlight(active ? null : c)}
                    style={[styles.swatch, { backgroundColor: highlightColors[c] }, active && styles.swatchActive]}
                  >
                    {active && <Ionicons name="checkmark" size={18} color={colors.Ink} />}
                  </Pressable>
                );
              })}
              {activeHighlight && (
                <Pressable accessibilityLabel="Remove highlight" onPress={() => pickHighlight(null)} style={[styles.swatch, styles.swatchClear]}>
                  <Ionicons name="close" size={18} color={colors.muted} />
                </Pressable>
              )}
            </View>

            <Tile icon={p.bookmarked ? 'bookmark' : 'bookmark-outline'} label={p.bookmarked ? 'Saved' : 'Save'} onPress={p.onBookmark} />
            <Tile icon="document-text-outline" label="Note" onPress={p.onPrivateNote} />
            <Tile icon={copied ? 'checkmark' : 'copy-outline'} label={copied ? 'Copied' : 'Copy'} onPress={copy} />
            <Tile icon="share-outline" label="Share" onPress={shareExternally} />
          </ScrollView>

          {expanded ? (
            <Animated.View key="more" style={styles.more} entering={FadeIn.duration(180).delay(60)} exiting={FadeOut.duration(120)}>
              <Text style={styles.ref}>{ref}</Text>
              <Row icon="people-outline" label="Share a reflection with your circle" onPress={p.onShare} />
              {p.circleReflectionCount > 0 && (
                <Row
                  icon="chatbubbles-outline"
                  label={`Read ${p.circleReflectionCount} reflection${p.circleReflectionCount === 1 ? '' : 's'} on this verse`}
                  onPress={p.onViewReflections}
                />
              )}
            </Animated.View>
          ) : (
            <Animated.View key="hint" entering={FadeIn.duration(180).delay(60)} exiting={FadeOut.duration(120)}>
              <Pressable onPress={() => setExpandedJS(true)} style={styles.hint} hitSlop={6}>
                <Ionicons name="chevron-up" size={14} color={colors.muted} />
                <Text style={styles.hintText}>Swipe up for more</Text>
              </Pressable>
            </Animated.View>
          )}
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

function Tile({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <Pressable style={({ pressed }) => [styles.tile, pressed && styles.pressed]} onPress={onPress}>
      <Ionicons name={icon} size={22} color={colors.Ink} />
      <Text style={styles.tileText}>{label}</Text>
    </Pressable>
  );
}

function Row({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <Pressable style={({ pressed }) => [styles.row, pressed && styles.pressed]} onPress={onPress}>
      <Ionicons name={icon} size={20} color={colors.Gold} />
      <Text style={styles.rowText}>{label}</Text>
    </Pressable>
  );
}

const SWATCH = 34;

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: spacing.xs, right: spacing.xs },
  sheet: {
    backgroundColor: colors.Mat,
    borderRadius: radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingBottom: spacing.sm,
    overflow: 'hidden',
  },
  handleHit: { alignItems: 'center', paddingTop: spacing.xs, paddingBottom: spacing.sm },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.inactive },
  actions: { paddingHorizontal: spacing.sm, gap: spacing.xs, alignItems: 'stretch' },
  swatchGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
  },
  swatch: {
    width: SWATCH,
    height: SWATCH,
    borderRadius: SWATCH / 2,
    borderWidth: 1,
    borderColor: '#0000001a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchActive: { borderWidth: 2, borderColor: colors.Ink },
  swatchClear: { backgroundColor: colors.paper },
  tile: {
    minWidth: 68,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxs,
  },
  tileText: { fontFamily: typography.fontFamily.body, fontSize: 14, color: colors.Ink },
  pressed: { opacity: 0.6 },
  hint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xxs, paddingTop: spacing.sm },
  hintText: { fontFamily: typography.fontFamily.body, fontSize: 13, color: colors.muted },
  more: { paddingHorizontal: spacing.md, paddingTop: spacing.md, gap: spacing.xxs },
  ref: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.caption,
    color: colors.Gold,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: spacing.xxs,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  rowText: { fontFamily: typography.fontFamily.body, fontSize: 16, color: colors.Ink },
});
