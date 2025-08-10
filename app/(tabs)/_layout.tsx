import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs
      initialRouteName="capture"
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="capture"
        options={{
          title: "Capture",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "camera" : "camera-outline"} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="verify"
        options={{
          title: "Verify",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "checkmark-circle" : "checkmark-circle-outline"}
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="records-list"
        options={{
          title: "Records",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "list" : "list-outline"} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="add-edit"
        options={{
          title: "Add/Edit",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "create" : "create-outline"} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "settings" : "settings-outline"} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="export"
        options={{
          title: "Export",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "share" : "share-outline"} color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

