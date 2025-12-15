import { useEffect, useMemo, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, TextInput, Button, Alert, FlatList, StyleSheet } from "react-native";
import { api } from "../../src/api/api";

export default function Wishlist() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ sets: [], rarities: [] });

  const [name, setName] = useState("");
  const [cardSet, setCardSet] = useState("");
  const [priority, setPriority] = useState("5");

  async function load() {
    try {
      const res = await api.get("/wishlist");
      setItems(res.data.items || []);
    } catch (e) {
      Alert.alert("Error", e?.response?.data?.error || "No se pudo cargar wishlist");
    }
  }

  async function loadMeta() {
    try {
      const res = await api.get("/cards/meta");
      setMeta(res.data);
    } catch {}
  }

  async function add() {
    if (!name.trim()) return Alert.alert("Falta nombre", "El nombre es obligatorio");

    try {
      await api.post("/wishlist/add", {
        name: name.trim(),
        setName: cardSet.trim() || null,
        priority: Number(priority) || 5,
      });
      setName("");
      setCardSet("");
      setPriority("5");
      await load();
      Alert.alert("✅", "Añadida a Busco");
    } catch (e) {
      Alert.alert("Error", e?.response?.data?.error || "No se pudo añadir");
    }
  }

  const setSuggestions = useMemo(() => {
    const q = cardSet.trim().toLowerCase();
    if (!q) return [];
    return meta.sets.filter(s => s.toLowerCase().includes(q)).slice(0, 6);
  }, [cardSet, meta.sets]);

  useEffect(() => { load(); loadMeta(); }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Busco (Wishlist)</Text>

      <View style={styles.box}>
        <Text style={styles.label}>Nombre *</Text>
        <TextInput placeholder="Ej: Umbreon VMAX" value={name} onChangeText={setName} style={styles.input} />

        <Text style={styles.label}>Set</Text>
        <TextInput placeholder="Ej: Evolving Skies" value={cardSet} onChangeText={setCardSet} style={styles.input} />
        {setSuggestions.length > 0 && (
          <View style={styles.suggestBox}>
            {setSuggestions.map(s => (
              <Text key={s} style={styles.suggest} onPress={() => setCardSet(s)}>{s}</Text>
            ))}
          </View>
        )}

        <Text style={styles.label}>Prioridad (1–10)</Text>
        <TextInput placeholder="5" keyboardType="numeric" value={priority} onChangeText={setPriority} style={styles.input} />

        <Button title="Añadir a Busco" onPress={add} />
      </View>

      <View style={{ marginTop: 16, flex: 1 }}>
        <FlatList
          data={items}
          keyExtractor={(i) => String(i.id)}
          ListEmptyComponent={<Text style={{ opacity: 0.7 }}>No tienes cartas en Busco.</Text>}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <Text style={styles.itemTitle}>{item.Card?.name}</Text>
              <Text style={styles.itemMeta}>
                {item.Card?.setName || "Sin set"} · prioridad {item.priority}
              </Text>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, flex: 1 },
  title: { fontSize: 22, fontWeight: "800", marginBottom: 12 },
  box: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 8 },
  label: { fontWeight: "700", marginTop: 6 },
  input: { borderWidth: 1, borderRadius: 10, padding: 10 },
  item: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 10 },
  itemTitle: { fontSize: 16, fontWeight: "800" },
  itemMeta: { marginTop: 4, opacity: 0.8 },
  suggestBox: { borderWidth: 1, borderRadius: 10, padding: 8, gap: 6 },
  suggest: { paddingVertical: 6, fontWeight: "700", opacity: 0.85 },
});
