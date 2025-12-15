import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, TextInput, Button, Alert } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { api } from "../../src/api/api";
import { setToken } from "../../src/utils/storage";

export default function Register() {
  const router = useRouter();
  const [username, setUsername] = useState("nuevo");
  const [email, setEmail] = useState("nuevo@test.com");
  const [password, setPassword] = useState("123456");
  const [city, setCity] = useState("Madrid");

  async function onRegister() {
    try {
      const res = await api.post("/auth/register", {
        username,
        email,
        password,
        city,
      });
      await setToken(res.data.token);
      router.replace("/(tabs)");
    } catch (e) {
      Alert.alert("Error", "Registro incorrecto");
    }
  }

  return (
    <SafeAreaView style={{ padding: 20, gap: 12, flex: 1 }}>
      <Text style={{ fontSize: 22, fontWeight: "700" }}>Registro</Text>

      <TextInput
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        style={{ borderWidth: 1, padding: 10, borderRadius: 8 }}
      />

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        style={{ borderWidth: 1, padding: 10, borderRadius: 8 }}
      />

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ borderWidth: 1, padding: 10, borderRadius: 8 }}
      />

      <TextInput
        placeholder="City"
        value={city}
        onChangeText={setCity}
        style={{ borderWidth: 1, padding: 10, borderRadius: 8 }}
      />

      <Button title="Crear cuenta" onPress={onRegister} />
    </SafeAreaView>
  );
}
