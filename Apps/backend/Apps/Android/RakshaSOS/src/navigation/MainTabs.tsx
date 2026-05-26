import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons'; // Expo's built-in icon library

import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen'; // The placeholder we just made
import { useApp } from '../context/AppContext';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  const { t } = useApp();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        // Hide the top header for the tabs since your HomeScreen has its own header design
        headerShown: false, 
        
        // Dynamic Icon Logic
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home-outline';

          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        
        // Tab Bar Styling
        tabBarActiveTintColor: '#DC2626',
        tabInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
      })}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={HomeScreen} 
        options={{ tabBarLabel: t('home') }} 
      />
      <Tab.Screen 
        name="ProfileTab" 
        component={ProfileScreen} 
        options={{ tabBarLabel: t('profile') }} 
      />
    </Tab.Navigator>
  );
}
