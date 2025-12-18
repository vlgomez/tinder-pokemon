import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, Alert, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { api } from "../../src/api/api";
import SwipeCard from "../../src/components/SwipeCard";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";

export default function Swipes() {
  const router = useRouter();
  const [candidates, setCandidates] = useState([]);
  const [idx, setIdx] = useState(0);
  const [busy, setBusy] = useState(false);
  const [matchOverlay, setMatchOverlay] = useState({ visible: false, other: null });

  async function load() {
    try {
      const res = await api.get("/swipes/candidates?limit=10");
      setCandidates(res.data.candidates || []);
      setIdx(0);
    } catch (e) {
      Alert.alert("Error", e?.response?.data?.error || "No se pudieron cargar candidatos");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const current = candidates[idx];
  const next = candidates[idx + 1];

  async function swipeRight() {
    if (!current || busy) return;
    setBusy(true);
    try {
      const res = await api.post("/swipes/like", { toUserId: current.user.id });
      if (res.data.match) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setMatchOverlay({ visible: true, other: res.data.match });
        setTimeout(() => setMatchOverlay({ visible: false, other: null }), 1400);
      } else {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setIdx((v) => v + 1);
    } catch (e) {
      Alert.alert("Error", e?.response?.data?.error || "No se pudo dar like");
    } finally {
      setBusy(false);
    }
  }

  async function swipeLeft() {
    if (!current || busy) return;
    setBusy(true);
    try {
      await api.post("/swipes/dislike", { toUserId: current.user.id });
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setIdx((v) => v + 1);
    } catch (e) {
      Alert.alert("Error", e?.response?.data?.error || "No se pudo dar dislike");
    } finally {
      setBusy(false);
    }
  }

  if (!current) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: "center" }]}>
        <View style={styles.emptyBox}>
          <Ionicons name="telescope" size={32} color="#94a3b8" />
          <Text style={styles.emptyTitle}>No hay candidatos disponibles</Text>
          <Text style={styles.emptyCopy}>
            Añade cartas en "Mis cartas" o en "Busco" y prueba recargar más tarde.
          </Text>
          <TouchableOpacity style={styles.pillButton} onPress={load}>
            <Ionicons name="refresh" size={16} color="#e0e7ff" />
            <Text style={styles.pillButtonText}>Recargar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.hero}>
        <View>
          <Text style={styles.title}>Descubrir</Text>
          <Text style={styles.subtitle}>Intercambios afinados a tus cartas</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.pillButton} onPress={() => router.push("/wishlist")}>
            <Ionicons name="bookmark" size={16} color="#e0e7ff" />
            <Text style={styles.pillButtonText}>Busco</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pillButton} onPress={load}>
            <Ionicons name="refresh" size={16} color="#e0e7ff" />
            <Text style={styles.pillButtonText}>Recargar</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.deckMeta}>
        <Text style={styles.metaText}>
          {candidates.length} candidatos · priorizados por afinidad
        </Text>
      </View>

      <View style={styles.stack}>
        {next ? (
          <View style={styles.behind}>
            <SwipeCard candidate={next} disabled onSwipeLeft={() => {}} onSwipeRight={() => {}} />
          </View>
        ) : null}

        <SwipeCard
          candidate={current}
          onSwipeLeft={swipeLeft}
          onSwipeRight={swipeRight}
          disabled={busy}
        />
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={[styles.actionBtn, styles.dislikeBtn]} onPress={swipeLeft} disabled={busy}>
          <Ionicons name="close" size={28} color="#ef4444" />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionBtn, styles.likeBtn]} onPress={swipeRight} disabled={busy}>
          <Ionicons name="heart" size={30} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.superlikeBtn]}
          onPress={async () => { await swipeRight(); }}
          disabled={busy}
        >
          <Ionicons name="star" size={26} color="#4f46e5" />
        </TouchableOpacity>
      </View>
      {matchOverlay.visible ? (
        <View style={styles.matchOverlay} pointerEvents="none">
          <Text style={styles.matchText}>MATCH!</Text>
          <Text style={styles.matchSub}>Revisa tus mensajes</Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, flex: 1, backgroundColor: "#0b1220" },
  hero: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  stack: { position: "relative", gap: 12 },
  behind: {
    position: "absolute",
    top: 10,
    left: 0,
    right: 0,
    transform: [{ scale: 0.98 }],
    opacity: 0.85,
  },
  actionsRow: { marginTop: 24, flexDirection: "row", justifyContent: "space-around" },
  actionBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 1,
    borderColor: "#1f2937",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111827",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 8,
    elevation: 6,
  },
  likeBtn: { backgroundColor: "#ef4444", borderWidth: 0 },
  dislikeBtn: { backgroundColor: "#111827" },
  superlikeBtn: { backgroundColor: "#eef2ff" },
  matchOverlay: { position: 'absolute', left: 0, right: 0, top: '40%', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.45)', padding: 18, marginHorizontal: 40, borderRadius: 12 },
  matchText: { color: '#fff', fontSize: 28, fontWeight: '900' },
  matchSub: { color: '#fff', opacity: 0.9 },
  title: { fontSize: 26, fontWeight: "900", color: "#e0e7ff" },
  subtitle: { color: "#94a3b8", marginTop: 2 },
  pillButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#1f2937",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  pillButtonText: { color: "#e0e7ff", fontWeight: "800" },
  headerActions: { flexDirection: "row", gap: 8 },
  deckMeta: { marginBottom: 12 },
  metaText: { color: "#94a3b8", fontWeight: "700" },
  emptyBox: {
    backgroundColor: "#0f172a",
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  emptyTitle: { color: "#e2e8f0", fontWeight: "800", fontSize: 18 },
  emptyCopy: { color: "#94a3b8", textAlign: "center" },
});
