import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { api } from "../../src/api/api";

export default function Chat() {
  const { matchId } = useLocalSearchParams();

  const [me, setMe] = useState(null);
  const [messages, setMessages] = useState([]);
  const [otherUser, setOtherUser] = useState(null);
  const [text, setText] = useState("");
  const listRef = useRef(null);

  async function loadMe() {
    const res = await api.get("/users/me");
    setMe(res.data.user);
  }

  async function loadMatch() {
    try {
      const res = await api.get(`/matches/${matchId}`);
      setOtherUser(res.data.match.otherUser);
    } catch (e) {
      console.error("No se pudo cargar match", e);
    }
  }

  async function loadMessages() {
    try {
      const res = await api.get(`/matches/${matchId}/messages`);
      setMessages(res.data.messages || []);
      setTimeout(() => listRef.current?.scrollToEnd?.({ animated: true }), 50);
    } catch (e) {
      const status = e?.response?.status;
      const msg = e?.response?.data?.error || e?.message || "Error desconocido";
      Alert.alert("Error", `No se pudieron cargar mensajes\n${status ? status + " - " : ""}${msg}`);
    }
  }

  async function send() {
    if (!text.trim()) return;

    try {
      await api.post(`/matches/${matchId}/messages`, { text: text.trim() });
      setText("");
      await loadMessages();
    } catch (e) {
      const status = e?.response?.status;
      const msg = e?.response?.data?.error || e?.message || "Error desconocido";
      Alert.alert("Error", `No se pudo enviar\n${status ? status + " - " : ""}${msg}`);
    }
  }

  useEffect(() => {
    loadMe().then(() => {
      loadMatch();
      loadMessages();
    });
  }, [matchId]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={80}
    >
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>{otherUser ? otherUser.username : "Chat"}</Text>
        <Text style={styles.sub}>{otherUser ? `📍 ${otherUser.city || "—"}` : `matchId: ${String(matchId)}`}</Text>

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => String(m.id)}
          contentContainerStyle={{ paddingVertical: 10 }}
          renderItem={({ item }) => {
            const mine = me && item.fromUserId === me.id;
            return (
              <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
                <Text style={styles.bubbleText}>{item.text}</Text>
                <Text style={styles.time}>
                  {item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}
                </Text>
              </View>
            );
          }}
          ListEmptyComponent={<Text style={{ opacity: 0.7 }}>Aún no hay mensajes.</Text>}
        />

        <View style={styles.row}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Escribe un mensaje..."
            style={styles.input}
          />
          <Button title="Enviar" onPress={send} />
        </View>

        <View style={{ marginTop: 8 }}>
          <Button title="Recargar mensajes" onPress={loadMessages} />
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, flex: 1 },
  title: { fontSize: 22, fontWeight: "900", marginBottom: 2 },
  sub: { opacity: 0.6, marginBottom: 10 },

  row: { flexDirection: "row", gap: 10, alignItems: "center" },
  input: { borderWidth: 1, borderRadius: 10, padding: 10, flex: 1 },

  bubble: { maxWidth: "85%", borderWidth: 1, borderRadius: 14, padding: 10, marginBottom: 10 },
  mine: { alignSelf: "flex-end" },
  theirs: { alignSelf: "flex-start", opacity: 0.95 },
  bubbleText: { fontSize: 16 },
  time: { marginTop: 6, fontSize: 11, opacity: 0.6 },
});
