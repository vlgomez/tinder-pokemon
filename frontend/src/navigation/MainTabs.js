import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import SwipesScreen from "../screens/SwipesScreen";
import MatchesScreen from "../screens/MatchesScreen";
import ProfileScreen from "../screens/ProfileScreen";

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Swipes"
        component={SwipesScreen}
        options={{ title: "Descubrir" }}
      />
      <Tab.Screen
        name="Matches"
        component={MatchesScreen}
        options={{ title: "Matches" }}
      />
      <Tab.Screen
        name="Perfil"
        component={ProfileScreen}
      />
    </Tab.Navigator>
  );
}
