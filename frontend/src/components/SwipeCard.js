import { View, Text, StyleSheet, Dimensions, Image } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

const { width } = Dimensions.get("window");
const SWIPE_THRESHOLD = width * 0.25;
const OFFSCREEN_X = width * 1.2;

export default function SwipeCard({
  candidate,
  onSwipeLeft,
  onSwipeRight,
  disabled,
}) {
  const user = candidate?.user || {};
  const translateX = useSharedValue(0);
  const isGone = useSharedValue(false);

  const pan = Gesture.Pan()
    .enabled(!disabled)
    .onUpdate((e) => {
      if (isGone.value) return;
      translateX.value = e.translationX;
    })
    .onEnd(() => {
      if (isGone.value) return;

      const x = translateX.value;

      if (x > SWIPE_THRESHOLD) {
        isGone.value = true;
        translateX.value = withTiming(OFFSCREEN_X, { duration: 180 }, () => {
          runOnJS(onSwipeRight)();
          translateX.value = 0;
          isGone.value = false;
        });
        return;
      }

      if (x < -SWIPE_THRESHOLD) {
        isGone.value = true;
        translateX.value = withTiming(-OFFSCREEN_X, { duration: 180 }, () => {
          runOnJS(onSwipeLeft)();
          translateX.value = 0;
          isGone.value = false;
        });
        return;
      }

      translateX.value = withSpring(0, { damping: 14, stiffness: 120 });
    });

  const cardStyle = useAnimatedStyle(() => {
    const rotate = `${translateX.value / 18}deg`;
    return {
      transform: [{ translateX: translateX.value }, { rotate }],
    };
  });

  const likeStyle = useAnimatedStyle(() => {
    const opacity = interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1]);
    return { opacity: Math.max(0, Math.min(1, opacity)) };
  });

  const nopeStyle = useAnimatedStyle(() => {
    const opacity = interpolate(translateX.value, [0, -SWIPE_THRESHOLD], [0, 1]);
    return { opacity: Math.max(0, Math.min(1, opacity)) };
  });

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.card, cardStyle]}>
        <Animated.View style={[styles.badge, styles.likeBadge, likeStyle]}>
          <Text style={styles.badgeText}>LIKE</Text>
        </Animated.View>

        <Animated.View style={[styles.badge, styles.nopeBadge, nopeStyle]}>
          <Text style={styles.badgeText}>NOPE</Text>
        </Animated.View>

        <View style={styles.avatarWrap}>
          {user.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder} />
          )}
          <View style={styles.scoreBadge}>
            <Text style={{ color: '#fff', fontWeight: '900' }}>★ {candidate?.score || 0}</Text>
          </View>
        </View>

        <Text style={styles.name}>{user.username}</Text>
        <Text style={styles.city}>📍 {user.city || "Sin ciudad"}</Text>

        <View style={styles.chipsRow}>
          {(candidate?.theyHaveINeed || []).slice(0,3).map((c) => (
            <View key={c.id} style={styles.chip}><Text style={styles.chipText}>Tiene: {c.name}</Text></View>
          ))}
          {(candidate?.theyNeedIHave || []).slice(0,3).map((c) => (
            <View key={c.id} style={[styles.chip, styles.chipNeed]}><Text style={styles.chipText}>Busca: {c.name}</Text></View>
          ))}
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    padding: 24,
    backgroundColor: "#fff",
    borderRadius: 18,
    elevation: 6,
  },
  name: { fontSize: 22, fontWeight: "800" },
  city: { marginTop: 8, fontSize: 16, opacity: 0.8 },

  badge: {
    position: "absolute",
    top: 18,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 3,
    borderRadius: 10,
    transform: [{ rotate: "-12deg" }],
  },
  likeBadge: { left: 18, borderColor: "#1dbf73" },
  nopeBadge: { right: 18, borderColor: "#ff4d4d" },
  badgeText: { fontSize: 18, fontWeight: "900" },
  avatar: { width: 96, height: 96, borderRadius: 48, marginBottom: 12 },
  avatarWrap: { alignItems: 'center', marginBottom: 6 },
  avatarPlaceholder: { width: 96, height: 96, borderRadius: 48, marginBottom: 12, backgroundColor: '#eee' },
  scoreBadge: { position: 'absolute', right: -6, top: -6, backgroundColor: '#ffb400', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 18, elevation: 6 },
  chipsRow: { marginTop: 8, flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  chip: { backgroundColor: '#f3f4f6', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 12, marginRight: 6 },
  chipNeed: { backgroundColor: '#e0f2fe' },
  chipText: { fontSize: 12, fontWeight: '700' },
});
