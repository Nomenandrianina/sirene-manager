// screens/WifiInstructionsScreen.js
import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Linking, Platform, StyleSheet, Text, View, } from 'react-native';
import CustomButton from '../components/CustomButton';
import { getAudioFiles } from '../services/esp32api';
import { COLORS } from '../utils/constants';

export default function WifiInstructionsScreen({ navigation }) {
  const [isConnected, setIsConnected]   = useState(false);
  const [networkType, setNetworkType]   = useState(null);
  const [verifying, setVerifying]       = useState(false);

  const isWifi = isConnected && networkType === 'wifi';

  useEffect(() => {
    checkConnection();
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
      setNetworkType(state.type);
    });
    return () => unsubscribe();
  }, []);

  const checkConnection = async () => {
    const state = await NetInfo.fetch();
    setIsConnected(state.isConnected);
    setNetworkType(state.type);
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
        'WiFi requis',
        'Connectez-vous au hotspot de la SIRENE depuis les paramètres WiFi.',
        [
          { text: 'Ouvrir paramètres', onPress: openWifiSettings },
          { text: 'Annuler', style: 'cancel' },
        ]
      );
      return;
    }

    // Vérifier que l'ESP32 répond (tenter de récupérer la liste)
    setVerifying(true);
    const result = await getAudioFiles();
    setVerifying(false);

    if (!result.success) {
      Alert.alert(
        '⚠️ Sirène non détectée',
        `Impossible de joindre la sirène.\n\nVérifiez que vous êtes bien connecté au hotspot de SIRENE.\n\nErreur : ${result.error}`,
        [
          { text: 'Ouvrir paramètres WiFi', onPress: openWifiSettings },
          { text: 'Réessayer', onPress: handleContinue },
          { text: 'Annuler', style: 'cancel' },
        ]
      );
      return;
    }

    // Tout est OK → aller à la liste audio
    navigation.navigate('AudioList');
  };

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
          color={isWifi ? COLORS.success : COLORS.textLight}
        />
      </View>

      {/* Titre */}
      <Text style={styles.title}>Connexion au hotspot ESP32</Text>
      <Text style={styles.subtitle}>
        Connectez-vous manuellement au WiFi{' '}
        <Text style={styles.bold}>SIRENE</Text>
      </Text>

      {/* Statut connexion */}
      <View style={[styles.statusBox, isWifi ? styles.statusSuccess : styles.statusWarning]}>
        <Ionicons
          name={isWifi ? 'wifi' : 'wifi-outline'}
          size={28}
          color={isWifi ? COLORS.success : COLORS.warning}
        />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.statusTitle}>
            {isWifi ? '✅ WiFi connecté' : '⚠️ Non connecté au WiFi'}
          </Text>
          <Text style={styles.statusText}>
            {isWifi
              ? 'Prêt à se connecter à la sirène'
              : 'Connectez-vous au hotspot SIRENE'}
          </Text>
        </View>
      </View>

      {/* Instructions */}
      <View style={styles.instructionsBox}>
        <Text style={styles.instructionsTitle}>📋 Instructions :</Text>
        <Text style={styles.instructionText}>
          1. Appuyez sur "Ouvrir paramètres WiFi"{'\n'}
          2. Recherchez le réseau{' '}
          <Text style={styles.bold}>SIRENE</Text>{'\n'}
          3. Connectez-vous avec le mot de passe{'\n'}
          4. Revenez dans l'application{'\n'}
          5. Appuyez sur "Continuer"
        </Text>
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
        />

        {/* Bouton continuer avec loader si vérification en cours */}
        {verifying ? (
          <View style={styles.verifyingBox}>
            <ActivityIndicator color={COLORS.primary} />
            <Text style={styles.verifyingText}>Connexion à la sirène en cours...</Text>
          </View>
        ) : (
          <CustomButton
            title="✓ Continuer"
            onPress={handleContinue}
            variant="success"
            disabled={!isWifi}
          />
        )}
      </View>

      {/* Note */}
      <View style={styles.note}>
        <Ionicons name="information-circle" size={16} color={COLORS.primary} />
        <Text style={styles.noteText}>
          L'application va vérifier automatiquement que la sirène est accessible avant de continuer.
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
  bold: {
    fontWeight: 'bold',
    color: COLORS.primary,
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
  buttonContainer: {
    gap: 12,
  },
  verifyingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: '#E3F2FD',
    borderRadius: 10,
  },
  verifyingText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
    gap: 8,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.primary,
  },
});
