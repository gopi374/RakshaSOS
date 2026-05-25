import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import EssentialDetailsScreen from '../screens/EssentialDetailsScreen';
import LanguageSelectionScreen from '../screens/LanguageSelectionScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import SplashScreen from '../screens/SplashScreen';
import TutorialScreen from '../screens/TutorialScreen';
import MainTabs from './MainTabs';

const stack = createNativeStackNavigator();

export default function AppNavigator(){

    return (
        <stack.Navigator initialRouteName="Signup">
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
        </stack.Navigator>
        
    )
}
