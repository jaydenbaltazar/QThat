import React, { use } from 'react'
import {Tabs} from 'expo-router';
import { useFonts } from 'expo-font';

const _layout = () => {
  const [loaded] = useFonts({
    Azonix: require('../assets/fonts/Azonix.otf'),
  });

  return (
      <Tabs
        screenOptions={{
        headerShown: false, // Hides header for all screens
        tabBarStyle: {
          display: 'none', // Hides the tab bar completely
      },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      {/* <Tabs.Screen name="search" options={{ title: "Search" }} /> */}

    </Tabs>
  )
}

export default _layout