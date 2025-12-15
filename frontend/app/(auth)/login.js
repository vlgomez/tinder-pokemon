import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, TextInput, Button, Alert } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { api } from "../../src/api/api";
import { setToken } from "../../src/utils/storage";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("pablo@test.com");
  const [password, setPassword] = useState("123456");

  async function onLogin() {
    try {
      const res = await api.post("/auth/login", { email, password });
      await setToken(String(res.data.token).trim());
      router.replace("/(tabs)");
    } catch (e) {
      Alert.alert("Error", "Login incorrecto");
    }
  }

  return (
    <SafeAreaView style={{ padding: 20, gap: 12, flex: 1 }}>
      <Text style={{ fontSize: 22, fontWeight: "700" }}>Login</Text>

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

      <Button title="Entrar" onPress={onLogin} />
      <Button title="Registro" onPress={() => router.push("/register")} />
    </SafeAreaView>
  );
}
