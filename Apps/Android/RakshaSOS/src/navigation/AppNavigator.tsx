import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import EssentialDetailsScreen from '../screens/EssentialDetailsScreen';
import LanguageSelectionScreen from '../screens/LanguageSelectionScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import SplashScreen from '../screens/SplashScreen';
import TutorialScreen from '../screens/TutorialScreen';
import MainTabs from './MainTabs';

// New Sub screens from D drive
import WomenSafetyScreen from '../screens/WomenSafetyScreen';
import VoiceSosScreen from '../screens/VoiceSosScreen';
import NearbyHospitalsScreen from '../screens/NearbyHospitalsScreen';
import EmergencyCallScreen from '../screens/EmergencyCallScreen';
import MapScreen from '../screens/MapScreen';
import HelpScreen from '../screens/HelpScreen';
import AssistantScreen from '../screens/AssistantScreen';

const stack = createNativeStackNavigator();

export default function AppNavigator(){

    return (
        <stack.Navigator initialRouteName="Splash">
            <stack.Screen name="Splash" component={SplashScreen} options={{headerShown:false}} />
            <stack.Screen name="Language" component={LanguageSelectionScreen} options={{headerShown:false}} />
            <stack.Screen name="Tutorial" component={TutorialScreen} options={{headerShown:false}} />
            <stack.Screen name="EssentialDetails" component={EssentialDetailsScreen} options={{headerShown:false}} />
            <stack.Screen name="Login" component={LoginScreen} options={{headerShown:false}}  />
            <stack.Screen name="Signup" component={SignupScreen} options={{headerShown:false}}/>
            
            <stack.Screen 
                name="MainTabs" 
                component={MainTabs} 
                // Disable header and gestures so they can't swipe back to Login
                options={{ headerShown: false, gestureEnabled: false }} 
            />

            {/* Sub Screens */}
            <stack.Screen name="WomenSafety" component={WomenSafetyScreen} options={{ headerShown: false }} />
            <stack.Screen name="VoiceSos" component={VoiceSosScreen} options={{ headerShown: false }} />
            <stack.Screen name="NearbyHospitals" component={NearbyHospitalsScreen} options={{ headerShown: false }} />
            <stack.Screen name="EmergencyCall" component={EmergencyCallScreen} options={{ headerShown: false }} />
            <stack.Screen name="Map" component={MapScreen} options={{ headerShown: false }} />
            <stack.Screen name="Help" component={HelpScreen} options={{ headerShown: false }} />
            <stack.Screen name="Assistant" component={AssistantScreen} options={{ headerShown: false }} />
        </stack.Navigator>
        
    )
}
