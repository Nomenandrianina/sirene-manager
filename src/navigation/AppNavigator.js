import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DrawerContentScrollView, DrawerItem, DrawerItemList, createDrawerNavigator } from '@react-navigation/drawer';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTranslation } from '../i18n/useTranslation';
import AuthenticationScreen from '../screens/AuthenticationScreen';
import DashboardScreen from '../screens/DashboardScreen';
import SettingsScreen from '../screens/SettingsScreen';
import UploadScreen from '../screens/UploadScreen';
import WifiConnectionScreen from '../screens/WifiConnectionScreen';
import { setAuthToken } from '../services/api';
import { COLORS } from '../utils/constants';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

// Contenu personnalisé du Drawer
function CustomDrawerContent(props) {
  const { t, language } = useTranslation();

  const handleLogout = async () => {
    await AsyncStorage.clear();
    setAuthToken(null);
    props.navigation.getParent().reset({
      index: 0,
      routes: [{ name: 'WifiConnection' }],
    });
  };

  const languageFlags = { fr: '🇫🇷', en: '🇬🇧', mg: '🇲🇬' };

  return (
    <DrawerContentScrollView {...props} style={styles.drawerContainer}>
      {/* En-tête du Drawer */}
      <View style={styles.drawerHeader}>
        <View style={styles.drawerIconContainer}>
          <Ionicons name="megaphone" size={48} color="#fff" />
        </View>
        <Text style={styles.drawerTitle}>{t('nav.appName')}</Text>
        <Text style={styles.drawerSubtitle}>{t('nav.version')}</Text>
        <View style={styles.languageBadge}>
          <Text style={styles.languageBadgeText}>
            {languageFlags[language]} {language.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Séparateur */}
      <View style={styles.separator} />

      {/* Liste des écrans */}
      <DrawerItemList {...props} />

      {/* Séparateur */}
      <View style={styles.separator} />

      {/* Bouton déconnexion */}
      <DrawerItem
        label={t('nav.logout')}
        icon={({ color, size }) => (
          <Ionicons name="log-out-outline" size={size} color={COLORS.error} />
        )}
        onPress={handleLogout}
        labelStyle={{ color: COLORS.error, fontWeight: 'bold' }}
      />

      {/* Pied de page */}
      <View style={styles.drawerFooter}>
        <Text style={styles.footerText}>© 2024 Sirène ESP32</Text>
      </View>
    </DrawerContentScrollView>
  );
}

// Drawer Principal
function MainDrawer() {
  const { t } = useTranslation();

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
        drawerActiveTintColor: COLORS.primary,
        drawerInactiveTintColor: COLORS.textLight,
        drawerActiveBackgroundColor: '#E3F2FD',
        drawerStyle: {
          backgroundColor: '#fff',
          width: 280,
        },
        drawerLabelStyle: {
          fontSize: 15,
          fontWeight: '600',
          marginLeft: -10,
        },
      }}
    >
      <Drawer.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: t('nav.dashboard'),
          drawerLabel: t('nav.dashboard'),
          drawerIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Upload"
        component={UploadScreen}
        options={{
          title: t('nav.upload'),
          drawerLabel: t('nav.upload'),
          drawerIcon: ({ color, size }) => (
            <Ionicons name="cloud-upload-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: t('nav.settings'),
          drawerLabel: t('nav.settings'),
          drawerIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
}

// Navigation globale
export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="WifiConnection" component={WifiConnectionScreen} />
        <Stack.Screen name="Authentication" component={AuthenticationScreen} />
        <Stack.Screen name="Main" component={MainDrawer} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
  },
  drawerHeader: {
    backgroundColor: COLORS.primary,
    padding: 20,
    paddingTop: 40,
    alignItems: 'center',
  },
  drawerIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  drawerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  drawerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 4,
  },
  languageBadge: {
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  languageBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  separator: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 8,
    marginHorizontal: 16,
  },
  drawerFooter: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: COLORS.textLight,
  },
});