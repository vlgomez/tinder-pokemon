import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, Button, Alert } from "react-native";
import { clearToken } from "../../src/utils/storage";
import { useRouter } from "expo-router";

export default function Profile() {
  const router = useRouter();

  async function logout() {
    await clearToken();
    Alert.alert("Sesión cerrada");
    router.replace("/login");
  }

  return (
    <SafeAreaView style={{ padding: 20, gap: 10, flex: 1 }}>
      <Text style={{ fontSize: 22, fontWeight: "700" }}>Perfil</Text>
      <Button title="Cerrar sesión" onPress={logout} />
    </SafeAreaView>
  );
}
