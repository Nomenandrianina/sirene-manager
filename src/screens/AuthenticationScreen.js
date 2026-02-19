import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View, } from 'react-native';
import CustomButton from '../components/CustomButton';
import { apiService, setAuthToken } from '../services/api';
import { COLORS } from '../utils/constants';

export default function AuthenticationScreen({ navigation }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuthentication = async () => {
    if (!code || code.length < 4) {
      Alert.alert('Erreur', 'Veuillez entrer un code valide (minimum 4 chiffres).');
      return;
    }

    setLoading(true);
    try {
      // Appeler l'API d'authentification
      const response = await apiService.authenticate(code);

      if (response.success && response.token) {
        // Sauvegarder le token
        await AsyncStorage.setItem('auth_token', response.token);
        setAuthToken(response.token);

        Alert.alert('Authentification réussie', 'Bienvenue !', [
          {
            text: 'OK',
            onPress: () =>navigation.navigate('Main', { screen: 'Dashboard' })
            ,
          },
        ]);
      } else {
        Alert.alert('Erreur', 'Code incorrect. Veuillez réessayer.');
      }
    } catch (error) {
      console.error('Erreur authentification:', error);
      
      if (error.response?.status === 401) {
        Alert.alert('Erreur', 'Code incorrect. Veuillez réessayer.');
      } else if (error.code === 'ECONNABORTED') {
        Alert.alert('Erreur', 'Délai d\'attente dépassé. Vérifiez votre connexion WiFi.');
      } else {
        Alert.alert(
          'Erreur de connexion',
          'Impossible de se connecter au dispositif. Vérifiez que vous êtes bien connecté au WiFi.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Authentification</Text>
        <Text style={styles.subtitle}>
          Entrez le code d'accès pour gérer la sirène
        </Text>

        <View style={styles.codeContainer}>
          <Text style={styles.label}>Code d'accès</Text>
          <TextInput
            style={styles.codeInput}
            placeholder="Entrez le code"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            maxLength={6}
            secureTextEntry
            autoFocus
          />
        </View>

        <CustomButton
          title="Valider"
          onPress={handleAuthentication}
          loading={loading}
          disabled={!code || code.length < 4}
        />

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>← Retour à la connexion WiFi</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 40,
    textAlign: 'center',
  },
  codeContainer: {
    marginBottom: 32,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  codeInput: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    fontSize: 24,
    textAlign: 'center',
    letterSpacing: 8,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  backButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  backText: {
    color: COLORS.primary,
    fontSize: 14,
  },
});