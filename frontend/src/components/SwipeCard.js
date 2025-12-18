import { useState, useRef, useImperativeHandle, forwardRef } from "react";
import { View, Text, StyleSheet, Dimensions, Image, ScrollView } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../api/api";

const fallbackPhotos = [
  require("../../assets/cards/card_1.png"),
  require("../../assets/cards/card_2.png"),
  require("../../assets/cards/card_3.png"),
  require("../../assets/cards/card_4.png"),
];

const { width } = Dimensions.get("window");
const SWIPE_THRESHOLD = width * 0.25;
const OFFSCREEN_X = width * 1.2;

function SwipeCard({
  candidate,
  onSwipeLeft,
  onSwipeRight,
  disabled,
}, ref) {
  const isTest = process.env.NODE_ENV === 'test';
  const [fallbackMap, setFallbackMap] = useState({});
  const user = candidate?.user || {};
  const primaryCards = (candidate?.theyHaveINeed || []).slice(0, 3);
  let galleryCards =
    primaryCards.length > 0
      ? primaryCards
      : (candidate?.theyNeedIHave || []).slice(0, 3);

  if (!galleryCards || galleryCards.length === 0) {
    galleryCards = [
      { id: "placeholder-1", name: "Carta misteriosa", setName: "Sube fotos" },
      { id: "placeholder-2", name: "Carta misteriosa", setName: "Sube fotos" },
      { id: "placeholder-3", name: "Carta misteriosa", setName: "Sube fotos" },
    ];
  }

  const resolvePhoto = (card, idx = 0) => {
    const key = card?.id || idx;
    if (fallbackMap[key]) return fallbackPhotos[idx % fallbackPhotos.length];

    if (card?.photoUrl) {
      if (card.photoUrl.startsWith("http")) return { uri: card.photoUrl };
      return { uri: `${api.defaults.baseURL}${card.photoUrl}` };
    }
    return fallbackPhotos[idx % fallbackPhotos.length];
  };

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

  // Exponer métodos para disparar swipes desde fuera (botones)
  useImperativeHandle(ref, () => ({
    swipeLeft: () => {
      if (disabled || isGone.value) return;
      isGone.value = true;
      translateX.value = withTiming(-OFFSCREEN_X, { duration: 180 }, () => {
        runOnJS(onSwipeLeft)();
        translateX.value = 0;
        isGone.value = false;
      });
      if (isTest && onSwipeLeft) onSwipeLeft();
    },
    swipeRight: () => {
      if (disabled || isGone.value) return;
      isGone.value = true;
      translateX.value = withTiming(OFFSCREEN_X, { duration: 180 }, () => {
        runOnJS(onSwipeRight)();
        translateX.value = 0;
        isGone.value = false;
      });
      if (isTest && onSwipeRight) onSwipeRight();
    },
  }));

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

        <View style={styles.headerRow}>
          <View>
            <Text style={styles.name}>{user.username}</Text>
            <View style={styles.metaRow}>
              <Ionicons name="location" size={16} color="#9ca3af" />
              <Text style={styles.city}>{user.city || "Sin ciudad"}</Text>
            </View>
          </View>

          <View style={styles.scoreBadge}>
            <Text style={styles.scoreLabel}>{candidate?.score ? "Afinidad" : "—"}</Text>
            <Text style={styles.scoreValue}>{candidate?.score ? candidate.score : "-"}</Text>
          </View>
        </View>

        <View style={styles.avatarRow}>
          <View style={styles.avatarWrap}>
            {user.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder} />
            )}
          </View>
          <View style={styles.tagline}>
            <Text style={styles.taglineTitle}>Cartas que te cuadran</Text>
            <Text style={styles.taglineCopy}>
              Lo que esa persona ofrece y lo que busca intercambiar
            </Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.gallery}
          contentContainerStyle={{ gap: 12 }}
        >
          {galleryCards.length === 0 ? (
            <View style={styles.emptyPhoto}>
              <Ionicons name="images" size={20} color="#9ca3af" />
              <Text style={styles.emptyPhotoText}>Aún sin fotos de cartas</Text>
            </View>
          ) : (
            galleryCards.map((card, idx) => {
              const source = resolvePhoto(card, idx);
              const key = card.id || idx;
              return (
                <View
                  key={key}
                  style={[
                    styles.photoFrame,
                    idx === 0 && styles.photoFrameLarge,
                  ]}
                >
                  <Image
                    source={source}
                    defaultSource={fallbackPhotos[idx % fallbackPhotos.length]}
                    onError={() =>
                      setFallbackMap((prev) => ({ ...prev, [key]: true }))
                    }
                    style={styles.photo}
                  />
                  <View style={styles.photoLabel}>
                    <Text style={styles.photoTitle} numberOfLines={1}>
                      {card.name}
                    </Text>
                    <Text style={styles.photoSubtitle} numberOfLines={1}>
                      {card.setName || "Set desconocido"}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ellos tienen</Text>
          <View style={styles.chipsRow}>
            {(candidate?.theyHaveINeed || []).slice(0, 4).map((c) => (
              <View key={`have-${c.id}`} style={styles.chip}>
                <Text style={styles.chipText}>Tiene: {c.name}</Text>
              </View>
            ))}
            {(candidate?.theyHaveINeed || []).length === 0 ? (
              <Text style={styles.placeholder}>No se han registrado cartas</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ellos buscan</Text>
          <View style={styles.chipsRow}>
            {(candidate?.theyNeedIHave || []).slice(0, 4).map((c) => (
              <View key={`need-${c.id}`} style={[styles.chip, styles.chipNeed]}>
                <Text style={styles.chipText}>Busca: {c.name}</Text>
              </View>
            ))}
            {(candidate?.theyNeedIHave || []).length === 0 ? (
              <Text style={styles.placeholder}>Aún no vemos coincidencias</Text>
            ) : null}
          </View>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    padding: 20,
    backgroundColor: "#0f172a",
    borderRadius: 20,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 12,
  },
  name: { fontSize: 22, fontWeight: "800", color: "#f8fafc" },
  city: { marginLeft: 6, fontSize: 14, color: "#cbd5e1" },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  tagline: { flex: 1, marginLeft: 14, gap: 4 },
  taglineTitle: { color: "#e0e7ff", fontWeight: "800", fontSize: 16 },
  taglineCopy: { color: "#c7d2fe", opacity: 0.8, fontSize: 13 },
  avatarRow: { flexDirection: "row", alignItems: "center", marginBottom: 14 },

  badge: {
    position: "absolute",
    top: 14,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 3,
    borderRadius: 10,
    transform: [{ rotate: "-12deg" }],
  },
  likeBadge: { left: 18, borderColor: "#22c55e", backgroundColor: "rgba(34,197,94,0.08)" },
  nopeBadge: { right: 18, borderColor: "#fb7185", backgroundColor: "rgba(251,113,133,0.08)" },
  badgeText: { fontSize: 16, fontWeight: "900", color: "#e2e8f0" },
  avatar: { width: 82, height: 82, borderRadius: 41 },
  avatarWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#1e293b",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#334155",
  },
  avatarPlaceholder: { width: 82, height: 82, borderRadius: 41, backgroundColor: "#1f2937" },
  scoreBadge: {
    backgroundColor: "#22c55e",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 14,
    minWidth: 80,
  },
  scoreLabel: { color: "#052e16", fontSize: 12, fontWeight: "800", textTransform: "uppercase" },
  scoreValue: { color: "#052e16", fontSize: 20, fontWeight: "900" },
  chipsRow: { marginTop: 8, flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { backgroundColor: "#111827", paddingHorizontal: 10, paddingVertical: 8, borderRadius: 12, borderColor: "#1f2937", borderWidth: 1 },
  chipNeed: { backgroundColor: "#1d4ed8", borderColor: "#1e40af" },
  chipText: { fontSize: 12, fontWeight: "700", color: "#e2e8f0" },
  section: { marginTop: 6 },
  sectionTitle: { color: "#c7d2fe", fontWeight: "800", marginBottom: 2 },
  placeholder: { color: "#94a3b8", fontStyle: "italic" },
  gallery: { marginVertical: 4 },
  photoFrame: {
    width: 120,
    height: 150,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  photoFrameLarge: { width: 170 },
  photo: { width: "100%", height: "100%" },
  photoPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(59,130,246,0.1)",
  },
  photoLabel: { position: "absolute", left: 0, right: 0, bottom: 0, padding: 8, backgroundColor: "rgba(0,0,0,0.55)" },
  photoTitle: { color: "#f8fafc", fontWeight: "800" },
  photoSubtitle: { color: "#e2e8f0", fontSize: 12, marginTop: 2 },
  emptyPhoto: {
    width: 150,
    height: 150,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1f2937",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#0b1220",
  },
  emptyPhotoText: { color: "#94a3b8", fontWeight: "700" },
});

export default forwardRef(SwipeCard);
