import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Linking, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import CustomButton from '../components/CustomButton';
import { useTranslation } from '../i18n/useTranslation';
import { COLORS } from '../utils/constants';

// Réseaux communs à rechercher
const COMMON_ESP32_NAMES = [
  'SIRENE_ESP32_001',
  'SIRENE_ESP32_002',
  'TONI',
  'ESP32',
];

export default function WifiConnectionScreen({ navigation }) {
  const { t } = useTranslation();
  const [currentSSID, setCurrentSSID] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [manualSSID, setManualSSID] = useState('');

  useEffect(() => {
    checkConnection();
    
    // Écouter les changements de connexion
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
      if (state.type === 'wifi' && state.details?.ssid) {
        setCurrentSSID(state.details.ssid);
      }
    });

    return () => unsubscribe();
  }, []);

  const checkConnection = async () => {
    const state = await NetInfo.fetch();
    setIsConnected(state.isConnected);
    
    if (state.type === 'wifi' && state.details?.ssid) {
      const ssid = state.details.ssid;
      setCurrentSSID(ssid);
      console.log('📶 Connecté à:', ssid);
    }
  };

  const openWifiSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('App-Prefs:WIFI');
    } else {
      Linking.sendIntent('android.settings.WIFI_SETTINGS');
    }
  };

  const handleContinue = async () => {
    const state = await NetInfo.fetch();
    
    if (!state.isConnected || state.type !== 'wifi') {
      Alert.alert(
        t('common.error'),
        'Vous n\'êtes pas connecté à un réseau WiFi.\n\nVeuillez vous connecter manuellement depuis les paramètres.'
      );
      return;
    }

    const ssid = state.details?.ssid || currentSSID;
    
    if (!ssid) {
      Alert.alert(
        t('common.error'),
        'Impossible de détecter le nom du réseau WiFi.'
      );
      return;
    }

    // Vérifier si c'est un réseau ESP32
    const isESP32 = ssid.includes('SIRENE_ESP32') || 
                    ssid.includes('ESP32') || 
                    manualSSID.includes('SIRENE_ESP32');

    if (isESP32) {
      Alert.alert(
        t('common.success'),
        `Connecté à ${ssid}`,
        [
          {
            text: t('common.ok'),
            onPress: () => navigation.navigate('Authentication'),
          },
        ]
      );
    } else {
      Alert.alert(
        '⚠️ Réseau non reconnu',
        `Vous êtes connecté à "${ssid}".\n\nCe n'est pas un réseau SIRENE_ESP32.\n\nVoulez-vous continuer quand même ?`,
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: 'Continuer',
            onPress: () => navigation.navigate('Authentication'),
          },
        ]
      );
    }
  };

  const isESP32Network = currentSSID && 
    (currentSSID.includes('SIRENE_ESP32') || currentSSID.includes('ESP32'));

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Icône principale */}
      <View style={styles.iconContainer}>
        <Ionicons 
          name="wifi" 
          size={80} 
          color={isConnected ? COLORS.primary : COLORS.textLight} 
        />
      </View>

      {/* Titre */}
      <Text style={styles.title}>{t('wifi.title')}</Text>
      <Text style={styles.subtitle}>
        Connectez-vous manuellement au hotspot ESP32 depuis les paramètres
      </Text>

      {/* État de connexion actuel */}
      {currentSSID ? (
        <View style={[
          styles.statusBox,
          isESP32Network ? styles.statusSuccess : styles.statusWarning
        ]}>
          <Ionicons 
            name={isESP32Network ? 'checkmark-circle' : 'alert-circle'}
            size={28}
            color={isESP32Network ? COLORS.success : COLORS.warning}
          />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.statusTitle}>
              {isESP32Network ? '✅ Réseau ESP32 détecté' : '⚠️ Réseau actuel'}
            </Text>
            <Text style={styles.statusText}>{currentSSID}</Text>
          </View>
        </View>
      ) : (
        <View style={[styles.statusBox, styles.statusError]}>
          <Ionicons name="wifi-outline" size={28} color={COLORS.error} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.statusTitle}>Non connecté</Text>
            <Text style={styles.statusText}>
              Veuillez vous connecter à un réseau WiFi
            </Text>
          </View>
        </View>
      )}

      {/* Instructions */}
      <View style={styles.instructionsBox}>
        <Text style={styles.instructionsTitle}>📋 Instructions :</Text>
        <Text style={styles.instructionText}>
          1. Appuyez sur "Ouvrir paramètres WiFi"{'\n'}
          2. Recherchez un réseau nommé{' '}
          <Text style={styles.bold}>SIRENE_ESP32_XXX</Text>{'\n'}
          3. Connectez-vous avec le mot de passe{'\n'}
          4. Revenez dans l'application{'\n'}
          5. Appuyez sur "Continuer"
        </Text>
      </View>

      {/* Entrée manuelle (optionnel) */}
      <View style={styles.manualEntry}>
        <Text style={styles.label}>Ou entrez le nom du réseau :</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: SIRENE_ESP32_001"
          value={manualSSID}
          onChangeText={setManualSSID}
          autoCapitalize="none"
        />
      </View>

      {/* Boutons */}
      <View style={styles.buttonContainer}>
        <CustomButton
          title="📱 Ouvrir paramètres WiFi"
          onPress={openWifiSettings}
          variant="primary"
        />

        <CustomButton
          title="🔄 Vérifier la connexion"
          onPress={checkConnection}
          variant="primary"
          disabled={loading}
        />

        <CustomButton
          title="✓ Continuer"
          onPress={handleContinue}
          variant="success"
          disabled={!isConnected}
        />
      </View>

      {/* Note simulation */}
      <View style={styles.simulationNote}>
        <Ionicons name="information-circle" size={16} color={COLORS.primary} />
        <Text style={styles.simulationText}>
          💡 Mode manuel : Connectez-vous au WiFi depuis les paramètres du téléphone
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 20,
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: 24,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  statusSuccess: {
    backgroundColor: '#E8F5E9',
    borderWidth: 2,
    borderColor: COLORS.success,
  },
  statusWarning: {
    backgroundColor: '#FFF3E0',
    borderWidth: 2,
    borderColor: COLORS.warning,
  },
  statusError: {
    backgroundColor: '#FFEBEE',
    borderWidth: 2,
    borderColor: COLORS.error,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 13,
    color: COLORS.text,
  },
  instructionsBox: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionsTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 22,
  },
  bold: {
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  manualEntry: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  buttonContainer: {
    gap: 12,
  },
  simulationNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
    gap: 8,
  },
  simulationText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.primary,
  },
});