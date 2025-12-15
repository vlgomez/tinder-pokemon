import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  FlatList,
  StyleSheet,
  Switch,
  Pressable,
} from "react-native";
import { api } from "../../src/api/api";

export default function MyCards() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);

  // Formulario
  const [name, setName] = useState("");
  const [cardSet, setCardSet] = useState("");
  const [rarity, setRarity] = useState("");
  const [isForTrade, setIsForTrade] = useState(true);

  async function load() {
    try {
      setLoading(true);
      const res = await api.get("/cards/my");
      setCards(res.data.cards || []);
    } catch (e) {
      Alert.alert(
        "Error",
        e?.response?.data?.error || "No se pudieron cargar tus cartas"
      );
    } finally {
      setLoading(false);
    }
  }

  async function addCard() {
    if (!name.trim()) {
      return Alert.alert("Falta nombre", "El nombre es obligatorio");
    }

    try {
      await api.post("/cards/add", {
        name: name.trim(),
        setName: cardSet.trim() || null,
        rarity: rarity.trim() || null,
        isForTrade,
      });

      setName("");
      setCardSet("");
      setRarity("");
      setIsForTrade(true);

      await load();
      Alert.alert("✅ Carta añadida");
    } catch (e) {
      Alert.alert(
        "Error",
        e?.response?.data?.error || "No se pudo añadir la carta"
      );
    }
  }

  async function toggleTrade(id, value) {
    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isForTrade: value } : c))
    );

    try {
      await api.patch(`/cards/my/${id}`, { isForTrade: value });
    } catch {
      Alert.alert("Error", "No se pudo actualizar");
      load();
    }
  }

  async function deleteCard(id) {
    Alert.alert("Eliminar carta", "¿Seguro que quieres borrar esta carta?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Borrar",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/cards/my/${id}`);
            setCards((prev) => prev.filter((c) => c.id !== id));
          } catch {
            Alert.alert("Error", "No se pudo borrar");
          }
        },
      },
    ]);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Mis cartas</Text>

      {/* FORMULARIO */}
      <View style={styles.box}>
        <Text style={styles.subtitle}>Añadir carta</Text>

        <Text style={styles.label}>Nombre *</Text>
        <TextInput
          placeholder="Ej: Umbreon VMAX"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />
        <Text style={styles.help}>Nombre exacto de la carta</Text>

        <Text style={styles.label}>Set</Text>
        <TextInput
          placeholder="Ej: Evolving Skies"
          value={cardSet}
          onChangeText={setCardSet}
          style={styles.input}
        />
        <Text style={styles.help}>Colección a la que pertenece</Text>

        <Text style={styles.label}>Rareza</Text>
        <TextInput
          placeholder="Ej: Ultra Rare"
          value={rarity}
          onChangeText={setRarity}
          style={styles.input}
        />
        <Text style={styles.help}>Rareza oficial</Text>

        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.label}>Para intercambio</Text>
            <Text style={styles.help}>
              Otros usuarios podrán verla
            </Text>
          </View>
          <Switch value={isForTrade} onValueChange={setIsForTrade} />
        </View>

        <Button title="Añadir carta" onPress={addCard} />
      </View>

      {/* LISTADO */}
      <View style={{ marginTop: 16, flex: 1 }}>
        <View style={styles.rowBetween}>
          <Text style={styles.subtitle}>Tus cartas</Text>
          <Button title="Recargar" onPress={load} disabled={loading} />
        </View>

        <FlatList
          data={cards}
          keyExtractor={(item) => String(item.id)}
          ListEmptyComponent={
            <Text style={{ opacity: 0.6 }}>
              Aún no tienes cartas.
            </Text>
          }
          renderItem={({ item }) => (
            <View style={styles.item}>
              <View style={styles.rowBetween}>
                <Text style={styles.itemTitle}>
                  {item.Card?.name}
                </Text>
                <Pressable onPress={() => deleteCard(item.id)}>
                  <Text style={{ fontSize: 18 }}>🗑️</Text>
                </Pressable>
              </View>

              <Text style={styles.itemMeta}>
                {item.Card?.setName || "Sin set"} ·{" "}
                {item.Card?.rarity || "Sin rareza"}
              </Text>

              <View style={styles.rowBetween}>
                <Text style={styles.itemMeta}>Para intercambio</Text>
                <Switch
                  value={!!item.isForTrade}
                  onValueChange={(v) => toggleTrade(item.id, v)}
                />
              </View>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

/* ESTILOS */
const styles = StyleSheet.create({
  container: { padding: 16, flex: 1 },
  title: { fontSize: 22, fontWeight: "800", marginBottom: 12 },
  subtitle: { fontSize: 16, fontWeight: "700", marginBottom: 10 },
  label: { fontWeight: "700", marginTop: 6 },
  help: { fontSize: 12, opacity: 0.6, marginBottom: 6 },
  box: { borderWidth: 1, borderRadius: 14, padding: 14 },
  input: { borderWidth: 1, borderRadius: 10, padding: 10 },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  item: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  itemTitle: { fontSize: 16, fontWeight: "800" },
  itemMeta: { marginTop: 4, opacity: 0.8 },
});
