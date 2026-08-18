import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ActivityProvider } from './src/context/ActivityContext';
// Screens
import LoginScreen from './src/screens/auth/LoginScreen';
import TelegramLoginScreen from './src/screens/auth/TelegramLoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import ForgotPasswordScreen from './src/screens/auth/ForgotPasswordScreen';
import ResetPasswordScreen from './src/screens/auth/ResetPasswordScreen';
import DashboardScreen from './src/screens/dashboard/DashboardScreen';
import ProfileScreen from './src/screens/profile/ProfileScreen';
import EditProfileScreen from './src/screens/profile/EditProfileScreen';
import ChangePasswordScreen from './src/screens/profile/ChangePasswordScreen';
import StockScreen from './src/screens/stock/StockScreen';
import StockMovementsScreen from './src/screens/stock/StockMovementsScreen';
import CategoriesScreen from './src/screens/stock/CategoriesScreen';
import FournisseursScreen from './src/screens/stock/FournisseursScreen';
import EntrepotsScreen from './src/screens/stock/EntrepotsScreen';
import FacturationScreen from './src/screens/stock/FacturationScreen';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import SharedSidebar from './src/components/SharedSidebar';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const linking = {
  prefixes: ['http://localhost:8085', 'http://localhost'],
  config: {
    screens: {
      Login: 'login',
      TelegramLogin: 'telegram-login',
      Register: 'register',
      ForgotPassword: 'forgot-password',
      ResetPassword: 'reset-password/:uid/:token',
      Main: {
        screens: {
          Dashboard: 'dashboard',
          Stock: 'stock',
          Profile: 'profileScreen',
        },
      },
      EditProfile: 'edit-profile',
      ChangePassword: 'change-password',
      StockMovements: 'stock/movements',
      Categories: 'stock/categories',
      Fournisseurs: 'stock/fournisseurs',
      Entrepots: 'stock/entrepots',
      Facturation: 'stock/facturation',
    },
  },
};

function MainTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <SharedSidebar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Stock" component={StockScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          <Stack.Screen name="Main" component={MainTabNavigator} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} />
          <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
          <Stack.Screen name="StockMovements" component={StockMovementsScreen} />
          <Stack.Screen name="Categories" component={CategoriesScreen} />
          <Stack.Screen name="Fournisseurs" component={FournisseursScreen} />
          <Stack.Screen name="Entrepots" component={EntrepotsScreen} />
          <Stack.Screen name="Facturation" component={FacturationScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="TelegramLogin" component={TelegramLoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ActivityProvider>
        <NavigationContainer linking={linking}>
          <RootNavigator />
        </NavigationContainer>
      </ActivityProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc'
  },
  text: {
    fontSize: 18,
    marginBottom: 20,
    color: '#0a0e27'
  }
});
