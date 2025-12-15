import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, Alert, StyleSheet, TouchableOpacity, Button } from "react-native";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { api } from "../../src/api/api";
import SwipeCard from "../../src/components/SwipeCard";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
// (removed stray top-level Button)


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
      <View style={{ padding: 20, gap: 12 }}>
        <Text style={{ fontSize: 18, fontWeight: "700" }}>No hay candidatos disponibles.</Text>
        <Text style={{ opacity: 0.8 }}>
          Tip: crea otro usuario, añade carta “para intercambio” y ponla en wishlist del otro.
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Descubrir</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Text style={{ alignSelf: "center", opacity: 0.9 }}>{candidates.length} candidatos</Text>
          <Button title="➕ Busco" onPress={() => router.push("/wishlist")} />
          <Button title="Recargar" onPress={load} />
        </View>
      </View>
      <View style={styles.stack}>
        {/* carta de detrás (preview) */}
        {next ? (
          <View style={styles.behind}>
            <SwipeCard candidate={next} disabled onSwipeLeft={() => {}} onSwipeRight={() => {}} />
          </View>
        ) : null}

        {/* carta principal */}
        <SwipeCard
          candidate={current}
          onSwipeLeft={swipeLeft}
          onSwipeRight={swipeRight}
          disabled={busy}
        />
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={swipeLeft} disabled={busy}>
          <Ionicons name="close" size={28} color="#ff6b6b" />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionBtn, styles.likeBtn]} onPress={swipeRight} disabled={busy}>
          <Ionicons name="heart" size={30} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={async () => { await swipeRight(); }} disabled={busy}>
          <Ionicons name="star" size={26} color="#4f46e5" />
        </TouchableOpacity>
      </View>
      {matchOverlay.visible ? (
        <View style={styles.matchOverlay} pointerEvents="none">
          <Text style={styles.matchText}>¡MATCH!</Text>
          <Text style={styles.matchSub}>Revisa tus mensajes</Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, flex: 1 },
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
  actionBtn: { width: 64, height: 64, borderRadius: 32, borderWidth: 1, borderColor: "#ddd", alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  likeBtn: { backgroundColor: "#ff6b6b", borderWidth: 0 },
  matchOverlay: { position: 'absolute', left: 0, right: 0, top: '40%', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.45)', padding: 18, marginHorizontal: 40, borderRadius: 12 },
  matchText: { color: '#fff', fontSize: 28, fontWeight: '900' },
  matchSub: { color: '#fff', opacity: 0.9 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  title: { fontSize: 22, fontWeight: "800" },
});
