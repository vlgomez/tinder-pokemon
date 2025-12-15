import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: "#e91e63" }}>
      <Tabs.Screen
        name="index"
        options={{ title: "Descubrir", tabBarIcon: ({ color, size }) => <Ionicons name="search" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="mycards"
        options={{ title: "Mis cartas", tabBarIcon: ({ color, size }) => <Ionicons name="albums" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="matches"
        options={{ title: "Matches", tabBarIcon: ({ color, size }) => <Ionicons name="heart" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: "Perfil", tabBarIcon: ({ color, size }) => <Ionicons name="person" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="wishlist"
        options={{ title: "Busco", tabBarIcon: ({ color, size }) => <Ionicons name="star" color={color} size={size} /> }}
      />
    </Tabs>
  );
}
