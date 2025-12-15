import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, Button, Alert, StyleSheet, Image, Pressable } from "react-native";
import { api } from "../../src/api/api";
import { useRouter } from "expo-router";

export default function Matches() {
  const [matches, setMatches] = useState([]);
  const router = useRouter();

  async function load() {
    try {
      const res = await api.get("/matches");
      setMatches(res.data.matches || []);
    } catch (e) {
      const status = e?.response?.status;
      const msg = e?.response?.data?.error || e?.message || "Error desconocido";
      Alert.alert("Error /matches", `${status ? status + " - " : ""}${msg}`);
      setMatches([]);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Matches</Text>

      <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
        <Button title="Recargar" onPress={load} />
        {matches[0]?.id ? (
          <Button
            title="Abrir 1º chat"
            onPress={() => router.push(`/chat/${matches[0].id}`)}
          />
        ) : null}
      </View>

      <Text style={styles.subtitle}>Lista:</Text>
      {matches.length === 0 ? (
        <Text style={{ opacity: 0.75 }}>No hay matches (según /matches).</Text>
      ) : (
        matches.map((m) => (
          <Pressable key={String(m.id)} style={styles.matchItem} onPress={() => router.push(`/chat/${m.id}`)}>
            {m.otherUser?.avatarUrl ? (
              <Image source={{ uri: m.otherUser.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder} />
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.matchName}>{m.otherUser?.username || "Usuario"}</Text>
              <Text style={styles.matchMeta}>📍 {m.otherUser?.city || "—"}</Text>
              {m.lastMessage ? (
                <Text style={{ opacity: 0.8, marginTop: 6 }} numberOfLines={1}>{m.lastMessage.text}</Text>
              ) : null}
            </View>
            <Button title="Chat" onPress={() => router.push(`/chat/${m.id}`)} />
          </Pressable>
        ))
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, flex: 1 },
  title: { fontSize: 18, fontWeight: "900", marginBottom: 10 },
  subtitle: { fontSize: 14, fontWeight: "800", marginBottom: 8 },
  item: { paddingVertical: 6, borderBottomWidth: 1, opacity: 0.9 },
  matchItem: { flexDirection: "row", gap: 12, paddingVertical: 12, alignItems: "center", borderBottomWidth: 1 },
  matchItem: { flexDirection: "row", gap: 12, paddingVertical: 12, alignItems: "center", borderBottomWidth: 1 },
  avatar: { width: 56, height: 56, borderRadius: 28, marginRight: 12 },
  avatarPlaceholder: { width: 56, height: 56, borderRadius: 28, marginRight: 12, backgroundColor: "#eee" },
  matchName: { fontSize: 16, fontWeight: "800" },
  matchMeta: { marginTop: 2, opacity: 0.8 },
});
