import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, LayoutAnimation, PanResponder, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
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

/**
 * Compact, non-modal footer shown while a verse is selected. No backdrop and no
 * shadow — the reader stays visible and scrollable behind it. Swipe up for the
 * secondary actions, swipe down to dismiss.
 */
export default function VerseActionSheet(p: Props) {
  if (!p.verse) return null;
  // Remount per verse so the entrance animation and expanded state reset.
  return <Footer key={`${p.verse.bookId}-${p.verse.chapter}-${p.verse.verse}`} {...p} verse={p.verse} />;
}

function Footer(p: Props & { verse: BibleVerse }) {
  const ref = formatRef({ bookId: p.verse.bookId, chapter: p.verse.chapter, verseStart: p.verse.verse });
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const enter = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    Animated.spring(enter, { toValue: 1, useNativeDriver: true, damping: 20, stiffness: 220, mass: 0.8 }).start();
  }, [enter]);

  const toggleExpanded = (next: boolean) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(next);
  };

  // Keep latest state reachable from the (once-created) responder.
  const state = useRef({ expanded, onClose: p.onClose });
  state.current = { expanded, onClose: p.onClose };

  const pan = useMemo(
    () =>
      PanResponder.create({
        // Only claim clearly vertical drags so the horizontal action row still scrolls.
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 8 && Math.abs(g.dy) > Math.abs(g.dx) * 1.5,
        onPanResponderRelease: (_, g) => {
          const { expanded: isOpen, onClose } = state.current;
          if (g.dy < -30 && !isOpen) toggleExpanded(true);
          else if (g.dy > 30) isOpen ? toggleExpanded(false) : onClose();
        },
      }),
    [],
  );

  const copy = async () => {
    await Clipboard.setStringAsync(`“${p.verse.text.trim()}” — ${ref}`);
    setCopied(true);
    setTimeout(p.onClose, 700);
  };

  const shareExternally = () => {
    Share.share({ message: `“${p.verse.text.trim()}” — ${ref}` });
  };

  const translateY = enter.interpolate({ inputRange: [0, 1], outputRange: [220, 0] });

  return (
    <Animated.View style={[styles.wrap, { bottom: Math.max(insets.bottom, spacing.xs), transform: [{ translateY }] }]} pointerEvents="box-none">
      <View style={styles.sheet} {...pan.panHandlers}>
        <Pressable onPress={() => toggleExpanded(!expanded)} hitSlop={10} style={styles.handleHit}>
          <View style={styles.handle} />
        </Pressable>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.actions}
        >
          <View style={styles.swatchGroup}>
            {(Object.keys(highlightColors) as HighlightColor[]).map((c) => {
              const active = p.highlight === c;
              return (
                <Pressable
                  key={c}
                  accessibilityLabel={`Highlight ${c}`}
                  onPress={() => p.onHighlight(active ? null : c)}
                  style={[styles.swatch, { backgroundColor: highlightColors[c] }, active && styles.swatchActive]}
                >
                  {active && <Ionicons name="checkmark" size={18} color={colors.Ink} />}
                </Pressable>
              );
            })}
            {p.highlight && (
              <Pressable accessibilityLabel="Remove highlight" onPress={() => p.onHighlight(null)} style={[styles.swatch, styles.swatchClear]}>
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
          <View style={styles.more}>
            <Text style={styles.ref}>{ref}</Text>
            <Row icon="people-outline" label="Share a reflection with your circle" onPress={p.onShare} />
            {p.circleReflectionCount > 0 && (
              <Row
                icon="chatbubbles-outline"
                label={`Read ${p.circleReflectionCount} reflection${p.circleReflectionCount === 1 ? '' : 's'} on this verse`}
                onPress={p.onViewReflections}
              />
            )}
          </View>
        ) : (
          <Pressable onPress={() => toggleExpanded(true)} style={styles.hint} hitSlop={6}>
            <Ionicons name="chevron-up" size={14} color={colors.muted} />
            <Text style={styles.hintText}>Swipe up for more</Text>
          </Pressable>
        )}
      </View>
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
