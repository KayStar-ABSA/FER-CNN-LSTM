/* eslint-disable react/display-name */
import { FontAwesome } from "@expo/vector-icons";
import { Stack, Tabs } from "expo-router";

export default () => {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: "Báo cáo",
          tabBarIcon: ({ color }) => (
            <FontAwesome size={24} name="home" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="analyst"
        options={{
          tabBarLabel: "Phân tích",
          tabBarIcon: ({ color }) => (
            <FontAwesome size={24} name="camera" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          tabBarLabel: "Lịch sử",
          tabBarIcon: ({ color }) => (
            <FontAwesome size={24} name="clock-o" color={color} />
          ),
        }}
      />
    </Tabs>
  );
};
