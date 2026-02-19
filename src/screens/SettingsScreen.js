import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import CustomButton from '../components/CustomButton';
import { useTranslation } from '../i18n/useTranslation';
import { apiService, setAuthToken } from '../services/api';
import { COLORS, WIFI_CONFIG } from '../utils/constants';

const LANGUAGES = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'mg', label: 'Malagasy', flag: '🇲🇬' },
];

export default function SettingsScreen({ navigation }) {
  const { t, language, setLanguage } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChangeLanguage = async (langCode) => {
    await setLanguage(langCode);
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert(t('common.error'), t('settings.errorFields'));
      return;
    }
    if (newPassword.length < WIFI_CONFIG.PASSWORD_MIN_LENGTH) {
      Alert.alert(t('common.error'), t('settings.errorLength'));
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert(t('common.error'), t('settings.errorMatch'));
      return;
    }

    Alert.alert(t('common.confirm'), t('settings.confirmChange'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.ok'),
        onPress: async () => {
          setLoading(true);
          try {
            const response = await apiService.changePassword(newPassword);
            if (response.success) {
              Alert.alert(t('common.success'), t('settings.successChange'), [
                {
                  text: t('common.ok'),
                  onPress: async () => {
                    await AsyncStorage.clear();
                    setAuthToken(null);
                    navigation.getParent().reset({
                      index: 0,
                      routes: [{ name: 'WifiConnection' }],
                    });
                  },
                },
              ]);
            } else {
              Alert.alert(t('common.error'), t('settings.errorChange'));
            }
          } catch (error) {
            Alert.alert(t('common.error'), t('settings.errorChange'));
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const handleDisconnect = () => {
    Alert.alert(t('common.confirm'), t('settings.confirmLogout'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.logout'),
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.clear();
          setAuthToken(null);
          navigation.getParent().reset({
            index: 0,
            routes: [{ name: 'WifiConnection' }],
          });
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView}>

        {/* SECTION LANGUE */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="language" size={24} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>{t('settings.sectionLanguage')}</Text>
          </View>

          <View style={styles.languageList}>
            {LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.languageItem,
                  language === lang.code && styles.languageItemActive,
                ]}
                onPress={() => handleChangeLanguage(lang.code)}
              >
                <Text style={styles.languageFlag}>{lang.flag}</Text>
                <Text style={[
                  styles.languageLabel,
                  language === lang.code && styles.languageLabelActive,
                ]}>
                  {lang.label}
                </Text>
                {language === lang.code && (
                  <Ionicons
                    name="checkmark-circle"
                    size={22}
                    color={COLORS.primary}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* SECTION MOT DE PASSE */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="lock-closed-outline" size={24} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>{t('settings.sectionPassword')}</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('settings.currentPassword')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('settings.currentPassword')}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('settings.newPassword')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('settings.newPassword')}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('settings.confirmPassword')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('settings.confirmPassword')}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <CustomButton
            title={t('settings.btnChange')}
            onPress={handleChangePassword}
            loading={loading}
            variant="primary"
          />
        </View>

        {/* SECTION INFOS */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle-outline" size={24} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>{t('settings.sectionInfo')}</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>{t('settings.appVersion')}</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>{t('settings.device')}</Text>
            <Text style={styles.infoValue}>Sirène ESP32</Text>
          </View>
        </View>

        {/* SECTION DÉCONNEXION */}
        <View style={styles.section}>
          <CustomButton
            title={t('settings.btnLogout')}
            onPress={handleDisconnect}
            variant="error"
          />
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 20,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: COLORS.text,
    marginLeft: 10,
  },
  languageList: {
    gap: 10,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    gap: 12,
  },
  languageItemActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#E3F2FD',
  },
  languageFlag: {
    fontSize: 22,
  },
  languageLabel: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
  },
  languageLabelActive: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  infoCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
  },
});