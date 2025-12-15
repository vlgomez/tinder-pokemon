import { useEffect, useState } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AuthStack from "./AuthStack";
import MainTabs from "./MainTabs";
import { getToken } from "../utils/storage";

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);

  async function checkAuth() {
    const token = await getToken();
    setAuthed(!!token);
  }

  useEffect(() => {
    (async () => {
      await checkAuth();
      setLoading(false);
    })();
  }, []);

  if (loading) return null;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {authed ? (
        <Stack.Screen name="Main" component={MainTabs} />
      ) : (
        <Stack.Screen name="Auth" component={AuthStack} />
      )}
    </Stack.Navigator>
  );
}
