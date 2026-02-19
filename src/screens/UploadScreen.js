import { Ionicons } from '@expo/vector-icons';
import { ProgressView } from '@react-native-community/progress-view';
import * as DocumentPicker from 'expo-document-picker';
import React, { useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import CustomButton from '../components/CustomButton';
import { apiService } from '../services/api';
import { COLORS, FILE_CONFIG } from '../utils/constants';

export default function UploadScreen({ navigation, route }) {
  // Mode : 'add' ou 'replace'
  const mode = route.params?.mode || 'add';
  const existingFile = route.params?.existingFile || null;

  const [title, setTitle] = useState(existingFile?.title || '');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const isReplaceMode = mode === 'replace';

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];

      if (!file.mimeType || !file.mimeType.includes('audio')) {
        Alert.alert('Format non supporté', 'Veuillez sélectionner un fichier MP3.');
        return;
      }

      if (file.size > FILE_CONFIG.MAX_SIZE) {
        Alert.alert(
          'Fichier trop volumineux',
          `Taille max : ${FILE_CONFIG.MAX_SIZE / 1024 / 1024} MB`
        );
        return;
      }

      setSelectedFile(file);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sélectionner le fichier.');
    }
  };

  const handleUpload = async () => {
    if (!title.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un titre pour ce message.');
      return;
    }

    if (!selectedFile) {
      Alert.alert('Erreur', 'Veuillez sélectionner un fichier MP3.');
      return;
    }

    const confirmMessage = isReplaceMode
      ? `Remplacer "${existingFile.title}" par le nouveau fichier ?`
      : `Ajouter "${title}" avec le fichier "${selectedFile.name}" ?`;

    Alert.alert('Confirmation', confirmMessage, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Confirmer',
        onPress: async () => {
          setUploading(true);
          setUploadProgress(0);

          try {
            const response = await apiService.uploadMP3(
              selectedFile,
              title,
              (progress) => setUploadProgress(progress)
            );

            if (response.success) {
              Alert.alert('Succès', response.message, [
                {
                  text: 'OK',
                  onPress: () => navigation.goBack(),
                },
              ]);
            }
          } catch (error) {
            Alert.alert('Erreur', 'Impossible d\'uploader le fichier.');
          } finally {
            setUploading(false);
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons
          name={isReplaceMode ? 'swap-horizontal' : 'cloud-upload'}
          size={64}
          color={COLORS.primary}
        />
        <Text style={styles.title}>
          {isReplaceMode ? 'Remplacer un audio' : 'Ajouter un audio'}
        </Text>
        <Text style={styles.subtitle}>
          {isReplaceMode
            ? `Remplacement de "${existingFile?.title}"`
            : 'Nouveau message d\'alerte'}
        </Text>
      </View>

      <View style={styles.form}>
        {/* Titre */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            <Ionicons name="pricetag" size={14} color={COLORS.text} /> Titre du message
          </Text>
          <TextInput
            style={[
              styles.input,
              isReplaceMode && styles.inputDisabled
            ]}
            placeholder="Ex: BNGRC, Alerte_vent, Alerte_tsunami..."
            value={title}
            onChangeText={setTitle}
            editable={!isReplaceMode}
            autoCapitalize="none"
          />
          {isReplaceMode && (
            <Text style={styles.hint}>
              Le titre ne peut pas être modifié en mode remplacement
            </Text>
          )}
        </View>

        {/* Sélection du fichier */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            <Ionicons name="musical-note" size={14} color={COLORS.text} /> Fichier MP3
          </Text>

          <TouchableOpacity style={styles.filePicker} onPress={pickFile}>
            {selectedFile ? (
              <View style={styles.selectedFileInfo}>
                <Ionicons name="checkmark-circle" size={32} color={COLORS.success} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.selectedFileName}>{selectedFile.name}</Text>
                  <Text style={styles.selectedFileSize}>
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </Text>
                </View>
                <Ionicons name="refresh" size={24} color={COLORS.primary} />
              </View>
            ) : (
              <View style={styles.noFileInfo}>
                <Ionicons name="cloud-upload-outline" size={48} color={COLORS.textLight} />
                <Text style={styles.noFileText}>Appuyez pour sélectionner</Text>
                <Text style={styles.noFileSubText}>Format MP3, max 5MB</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Barre de progression */}
        {uploading && (
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>Upload en cours... {uploadProgress}%</Text>
            {Platform.OS === 'ios' ? (
              <ProgressView
                progress={uploadProgress / 100}
                progressTintColor={COLORS.primary}
                style={styles.progressBar}
              />
            ) : (
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBarFill, { width: `${uploadProgress}%` }]} />
              </View>
            )}
          </View>
        )}

        {/* Bouton Upload */}
        <CustomButton
          title={isReplaceMode ? '🔄 Remplacer' : '📤 Ajouter'}
          onPress={handleUpload}
          variant={isReplaceMode ? 'warning' : 'success'}
          loading={uploading}
          disabled={!selectedFile || !title.trim() || uploading}
        />

        <CustomButton
          title="Annuler"
          onPress={() => navigation.goBack()}
          variant="primary"
          disabled={uploading}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 12,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 6,
  },
  form: {
    padding: 20,
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  input: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  inputDisabled: {
    backgroundColor: '#f5f5f5',
    color: COLORS.textLight,
  },
  hint: {
    fontSize: 12,
    color: COLORS.warning,
    fontStyle: 'italic',
  },
  filePicker: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.primary,
    overflow: 'hidden',
  },
  selectedFileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  selectedFileName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  selectedFileSize: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 4,
  },
  noFileInfo: {
    alignItems: 'center',
    padding: 32,
  },
  noFileText: {
    fontSize: 16,
    color: COLORS.textLight,
    marginTop: 12,
  },
  noFileSubText: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 4,
  },
  progressContainer: {
    gap: 8,
  },
  progressText: {
    fontSize: 14,
    color: COLORS.text,
    textAlign: 'center',
  },
  progressBar: {
    height: 8,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
});