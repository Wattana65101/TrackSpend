import React, { useContext } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { AppProvider, AppContext } from "./screens/AppContext";
import AppNavigator from "./screens/AppNavigator";
import AuthStack from "./screens/AuthStack";

function MainApp() {
  const { token } = useContext(AppContext);
  return (
    <NavigationContainer>
      {token ? <AppNavigator /> : <AuthStack />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
