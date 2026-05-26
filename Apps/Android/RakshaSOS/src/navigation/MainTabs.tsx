import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MapScreen from '../screens/MapScreen';
import HelpScreen from '../screens/HelpScreen';
import AssistantScreen from '../screens/AssistantScreen';
import { useApp } from '../context/AppContext';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  const { t } = useApp();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,

        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;

          if (route.name === 'HomeTab') {
            iconName = focused ? 'shield-half' : 'shield-half-outline';
          } else if (route.name === 'MapTab') {
            iconName = focused ? 'map' : 'map-outline';
          } else if (route.name === 'HelpTab') {
            iconName = focused ? 'help-circle' : 'help-circle-outline';
          } else if (route.name === 'AssistantTab') {
            iconName = focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },

        tabBarActiveTintColor: '#ac2b2e', // Earthy Maroon brand color
        tabBarInactiveTintColor: '#777777',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F0EBEB',
          height: 65,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        }
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ tabBarLabel: 'SOS' }}
      />
      <Tab.Screen
        name="MapTab"
        component={MapScreen}
        options={{ tabBarLabel: 'Map' }}
      />
      <Tab.Screen
        name="HelpTab"
        component={HelpScreen}
        options={{ tabBarLabel: 'Manual' }}
      />
      <Tab.Screen
        name="AssistantTab"
        component={AssistantScreen}
        options={{ tabBarLabel: 'AI Guide' }}
      />
      <Tab.Screen
        name="ProfileTab" 
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
}
