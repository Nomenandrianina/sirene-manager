// screens/AudioListScreen.js
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View, } from 'react-native';
import { useESP32Connection } from '../hooks/useESP32Connection';
import { getAudioFiles, getAudioStreamUrl, renameAudioFile, uploadAudioFile } from '../services/esp32api';
import { COLORS } from '../utils/constants';

// ─── Formatage taille fichier ────────────────
const formatSize = (bytes) => {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

// ─── Bannière de déconnexion ─────────────────
const DisconnectedBanner = ({ onRetry }) => (
  <View style={styles.banner}>
    <Ionicons name="wifi-outline" size={20} color="#fff" />
    <Text style={styles.bannerText}>Connexion à la sirène perdue</Text>
    <TouchableOpacity style={styles.bannerRetry} onPress={onRetry}>
      <Text style={styles.bannerRetryText}>Réessayer</Text>
    </TouchableOpacity>
  </View>
);

// ─── Composant carte audio ───────────────────
const AudioCard = ({ file, onPlay, onRename, isPlaying, isLoading, disabled }) => (
  <View style={[styles.card, disabled && styles.cardDisabled]}>
    <View style={styles.cardLeft}>
      <Ionicons
        name="musical-note"
        size={28}
        color={disabled ? COLORS.textLight : COLORS.primary}
      />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={[styles.fileName, disabled && { color: COLORS.textLight }]} numberOfLines={1}>
          {file.name}
        </Text>
        <Text style={styles.fileSize}>{formatSize(file.size)}</Text>
      </View>
    </View>
    <View style={styles.cardActions}>
      {/* Bouton play */}
      <TouchableOpacity
        style={[styles.actionBtn, isPlaying && styles.actionBtnActive, disabled && styles.actionBtnDisabled]}
        onPress={() => onPlay(file)}
        disabled={isLoading || disabled}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={COLORS.primary} />
        ) : (
          <Ionicons
            name={isPlaying ? 'pause-circle' : 'play-circle'}
            size={26}
            color={disabled ? COLORS.textLight : isPlaying ? COLORS.success : COLORS.primary}
          />
        )}
      </TouchableOpacity>

      {/* Bouton renommer */}
      <TouchableOpacity
        style={[styles.actionBtn, disabled && styles.actionBtnDisabled]}
        onPress={() => onRename(file)}
        disabled={disabled}
      >
        <Ionicons name="pencil" size={22} color={disabled ? COLORS.textLight : COLORS.warning} />
      </TouchableOpacity>
    </View>
  </View>
);

// ─── Écran principal ─────────────────────────
export default function AudioListScreen({ navigation }) {
  const [files, setFiles]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [uploading, setUploading]       = useState(false);
  const [error, setError]               = useState(null);

  // Surveiller la connexion ESP32 en temps réel
  const { isConnected: esp32Connected, recheckNow } = useESP32Connection();

  // Audio player
  const soundRef                        = useRef(null);
  const [playingFile, setPlayingFile]   = useState(null);
  const [audioLoading, setAudioLoading] = useState(false);

  // Modal renommer
  const [renameModal, setRenameModal]   = useState(false);
  const [renameTarget, setRenameTarget] = useState(null);
  const [newName, setNewName]           = useState('');
  const [renaming, setRenaming]         = useState(false);

  // ── Si connexion perdue → arrêter la lecture en cours
  useEffect(() => {
    if (!esp32Connected && soundRef.current) {
      soundRef.current.stopAsync().then(() => {
        soundRef.current?.unloadAsync();
        soundRef.current = null;
        setPlayingFile(null);
      });
    }
  }, [esp32Connected]);

  // ── Chargement de la liste ─────────────────
  const loadFiles = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    const result = await getAudioFiles();

    if (result.success) {
      setFiles(result.files);
    } else {
      setError(result.error);
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadFiles();
    return () => {
      if (soundRef.current) soundRef.current.unloadAsync();
    };
  }, [loadFiles]);

  // ── Garde : bloquer si déconnecté ─────────
  const guardConnected = () => {
    if (!esp32Connected) {
      Alert.alert(
        '📡 Connexion perdue',
        'Vous n\'êtes plus connecté au hotspot de la sirène.\n\nReconnectez-vous au WiFi SIRENE_ESP32 pour continuer.'
      );
      return false;
    }
    return true;
  };

  // ── Lecture audio ──────────────────────────
  const handlePlay = async (file) => {
    if (!guardConnected()) return;

    if (playingFile?.name === file.name) {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      setPlayingFile(null);
      return;
    }

    if (soundRef.current) {
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }

    setAudioLoading(true);
    setPlayingFile(file);

    try {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      const { sound } = await Audio.Sound.createAsync(
        { uri: getAudioStreamUrl(file.name) },
        { shouldPlay: true }
      );
      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setPlayingFile(null);
          sound.unloadAsync();
          soundRef.current = null;
        }
      });
    } catch (e) {
      Alert.alert('Erreur lecture', `Impossible de lire ${file.name}\n${e.message}`);
      setPlayingFile(null);
    } finally {
      setAudioLoading(false);
    }
  };

  // ── Upload fichier ─────────────────────────
  const handleUpload = async () => {
    if (!guardConnected()) return;

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/mpeg',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      if (!file.name.endsWith('.mp3')) {
        Alert.alert('Format invalide', 'Seuls les fichiers .mp3 sont acceptés.');
        return;
      }

      setUploading(true);
      const upload = await uploadAudioFile(file.uri, file.name);

      if (upload.success) {
        Alert.alert('✅ Succès', `${file.name} uploadé avec succès.`);
        loadFiles();
      } else {
        Alert.alert('Erreur upload', upload.error);
      }
    } catch (e) {
      Alert.alert('Erreur', e.message);
    } finally {
      setUploading(false);
    }
  };

  // ── Renommer ───────────────────────────────
  const openRenameModal = (file) => {
    if (!guardConnected()) return;
    setRenameTarget(file);
    setNewName(file.name.replace(/\.mp3$/i, ''));
    setRenameModal(true);
  };

  const handleRename = async () => {
    if (!guardConnected()) return;
    if (!newName.trim()) {
      Alert.alert('Nom invalide', 'Le nom ne peut pas être vide.');
      return;
    }

    setRenaming(true);
    const result = await renameAudioFile(renameTarget.name, newName.trim());

    if (result.success) {
      setRenameModal(false);
      Alert.alert('✅ Renommé', `Fichier renommé en ${result.newName}`);
      loadFiles();
    } else {
      Alert.alert('Erreur', result.error);
    }
    setRenaming(false);
  };

  // ── Rendu ──────────────────────────────────
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Chargement des fichiers audio...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Ionicons name="wifi-outline" size={60} color={COLORS.danger} />
        <Text style={styles.errorTitle}>Impossible de joindre la sirène</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => loadFiles()}>
          <Text style={styles.retryText}>🔄 Réessayer</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.retryBtn, { backgroundColor: '#eee', marginTop: 8 }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.retryText, { color: COLORS.text }]}>← Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Bannière déconnexion */}
      {!esp32Connected && (
        <DisconnectedBanner onRetry={() => { recheckNow(); loadFiles(); }} />
      )}

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>🔊 Fichiers Audio</Text>
          <Text style={styles.headerSubtitle}>{files.length} fichier(s) sur la sirène</Text>
        </View>
        <TouchableOpacity
          style={[styles.uploadBtn, (!esp32Connected || uploading) && { opacity: 0.4 }]}
          onPress={handleUpload}
          disabled={!esp32Connected || uploading}
        >
          {uploading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="cloud-upload" size={18} color="#fff" />
              <Text style={styles.uploadBtnText}>Ajouter</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Liste */}
      {files.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="musical-notes-outline" size={60} color={COLORS.textLight} />
          <Text style={styles.emptyText}>Aucun fichier audio trouvé</Text>
          <Text style={styles.emptySubText}>Appuyez sur "Ajouter" pour uploader un .mp3</Text>
        </View>
      ) : (
        <FlatList
          data={files}
          keyExtractor={(item) => item.name}
          renderItem={({ item }) => (
            <AudioCard
              file={item}
              onPlay={handlePlay}
              onRename={openRenameModal}
              isPlaying={playingFile?.name === item.name}
              isLoading={audioLoading && playingFile?.name === item.name}
              disabled={!esp32Connected}
            />
          )}
          contentContainerStyle={styles.list}
          onRefresh={() => loadFiles(true)}
          refreshing={refreshing}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Overlay semi-transparent si déconnecté */}
      {!esp32Connected && <View style={styles.disconnectedOverlay} pointerEvents="none" />}

      {/* Modal renommer */}
      <Modal visible={renameModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>✏️ Renommer le fichier</Text>
            <Text style={styles.modalCurrent}>{renameTarget?.name}</Text>
            <TextInput
              style={styles.modalInput}
              value={newName}
              onChangeText={setNewName}
              placeholder="Nouveau nom (sans .mp3)"
              placeholderTextColor={COLORS.textLight}
              autoFocus
            />
            <Text style={styles.modalHint}>L'extension .mp3 sera ajoutée automatiquement</Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setRenameModal(false)}
                disabled={renaming}
              >
                <Text style={styles.modalBtnCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnConfirm, renaming && { opacity: 0.6 }]}
                onPress={handleRename}
                disabled={renaming}
              >
                {renaming ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalBtnConfirmText}>Renommer</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    color: COLORS.textLight,
    fontSize: 14,
  },
  // ── Bannière déconnexion ──
  banner: {
    backgroundColor: '#D32F2F',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
    zIndex: 100,
  },
  bannerText: {
    flex: 1,
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  bannerRetry: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  bannerRetryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  // ── Overlay déconnexion ──
  disconnectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.45)',
    zIndex: 50,
  },
  // ── Header ──
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    gap: 6,
  },
  uploadBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  // ── Liste ──
  list: {
    padding: 16,
    gap: 12,
  },
  // ── Card ──
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardDisabled: {
    backgroundColor: '#f9f9f9',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  fileSize: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  actionBtnActive: {
    backgroundColor: '#e8f5e9',
  },
  actionBtnDisabled: {
    backgroundColor: '#f0f0f0',
    opacity: 0.5,
  },
  // ── Empty / Error ──
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textLight,
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 13,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: 8,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D32F2F',
    marginTop: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 13,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: 8,
  },
  retryBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 20,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  // ── Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 6,
  },
  modalCurrent: {
    fontSize: 13,
    color: COLORS.textLight,
    marginBottom: 18,
    fontStyle: 'italic',
  },
  modalInput: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: COLORS.text,
    backgroundColor: '#fafafa',
  },
  modalHint: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 6,
    marginBottom: 20,
  },
  modalBtns: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalBtnCancel: {
    backgroundColor: '#f0f0f0',
  },
  modalBtnCancelText: {
    color: COLORS.text,
    fontWeight: '600',
  },
  modalBtnConfirm: {
    backgroundColor: COLORS.primary,
  },
  modalBtnConfirmText: {
    color: '#fff',
    fontWeight: '700',
  },
});
