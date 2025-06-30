import { useAuth } from "@/contexts/AuthContext";
import { Redirect } from "expo-router";

export default () => {
  const { isLoggedIn } = useAuth();

  if (isLoggedIn) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/auth/login" />;
};
