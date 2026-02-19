import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View, } from 'react-native';
import AudioPlayer from '../components/AudioPlayer';
import { apiService } from '../services/api';
import { COLORS } from '../utils/constants';

export default function DashboardScreen({ navigation }) {
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [playingId, setPlayingId] = useState(null);
  const [playerVisible, setPlayerVisible] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  // Recharger quand on revient sur l'écran
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation]);

  const loadData = async () => {
    try {
      setRefreshing(true);
      const [statusData, filesData] = await Promise.all([
        apiService.getStatus(),
        apiService.getFiles(),
      ]);
      setStatus(statusData);
      setFiles(filesData.files || []);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les données.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleTestPlay = async (file) => {
    setPlayingId(file.id);
    try {
      const response = await apiService.testPlay(file.id);
      if (response.success) {
        // Ouvrir le player avec les infos du fichier
        setSelectedFile({
          ...file,
          uri: file.uri || null, // null en mode simulation
        });
        setPlayerVisible(true);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de lire le fichier.');
    } finally {
      setPlayingId(null);
    }
  };

  const handleDelete = (file) => {
    Alert.alert(
      'Supprimer',
      `Voulez-vous supprimer "${file.title}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteFile(file.id);
              setFiles(prev => prev.filter(f => f.id !== file.id));
              Alert.alert('Succès', 'Fichier supprimé !');
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer le fichier.');
            }
          },
        },
      ]
    );
  };

  const handleReplace = (file) => {
    navigation.navigate('Upload', { 
      mode: 'replace', 
      existingFile: file 
    });
  };

  const handleAddNew = () => {
    navigation.navigate('Upload', { mode: 'add' });
  };

  const renderFileItem = ({ item }) => (
    <View style={styles.fileCard}>
      <View style={styles.fileHeader}>
        <View style={styles.fileIconContainer}>
          <Ionicons name="musical-notes" size={28} color={COLORS.primary} />
        </View>
        <View style={styles.fileInfo}>
          <Text style={styles.fileTitle}>{item.title}</Text>
          <Text style={styles.fileName}>{item.filename}</Text>
          <Text style={styles.fileSize}>
            {(item.size / 1024).toFixed(0)} KB
            {item.duration ? ` • ${item.duration}s` : ''}
          </Text>
        </View>
      </View>

      <View style={styles.fileActions}>
        {/* Bouton Lecture */}
        <TouchableOpacity
          style={[
            styles.actionButton, 
            styles.playButton,
            playingId === item.id && styles.playingButton,
          ]}
          onPress={() => handleTestPlay(item)}
          disabled={playingId !== null}
        >
          <Ionicons 
            name={playingId === item.id ? 'stop' : 'play'} 
            size={18} 
            color="#fff" 
          />
          <Text style={styles.actionButtonText}>
            {playingId === item.id ? 'Stop' : 'Lire'}
          </Text>
        </TouchableOpacity>

        {/* Bouton Remplacer */}
        <TouchableOpacity
          style={[styles.actionButton, styles.replaceButton]}
          onPress={() => handleReplace(item)}
          disabled={playingId !== null}
        >
          <Ionicons name="swap-horizontal" size={18} color="#fff" />
          <Text style={styles.actionButtonText}>Remplacer</Text>
        </TouchableOpacity>

        {/* Bouton Supprimer */}
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDelete(item)}
          disabled={playingId !== null}
        >
          <Ionicons name="trash" size={18} color="#fff" />
          <Text style={styles.actionButtonText}>Supprimer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Barre de statut */}
      {status && (
        <View style={styles.statusBar}>
          <View style={styles.statusItem}>
            <Ionicons name="document-text" size={16} color="#fff" />
            <Text style={styles.statusText}>{files.length} fichier(s)</Text>
          </View>
          <View style={styles.statusItem}>
            <Ionicons name="save" size={16} color="#fff" />
            <Text style={styles.statusText}>
              {(status.freeSpace / 1024 / 1024).toFixed(1)} MB libre
            </Text>
          </View>
          <View style={[
            styles.statusDot,
            { backgroundColor: status.connected ? '#4CAF50' : '#F44336' }
          ]} />
        </View>
      )}

      {/* Liste des fichiers */}
      <FlatList
        data={files}
        renderItem={renderFileItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadData} />
        }
        ListHeaderComponent={
          <Text style={styles.listTitle}>📂 Fichiers audio sur l'ESP32</Text>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open" size={64} color={COLORS.textLight} />
            <Text style={styles.emptyText}>Aucun fichier audio</Text>
            <Text style={styles.emptySubText}>
              Ajoutez votre premier message d'alerte
            </Text>
          </View>
        }
      />

      {/* Bouton Ajouter */}
      <TouchableOpacity style={styles.addButton} onPress={handleAddNew}>
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>

      <AudioPlayer
        visible={playerVisible}
        file={selectedFile}
        onClose={() => {
          setPlayerVisible(false);
          setSelectedFile(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.textLight,
  },
  statusBar: {
    backgroundColor: COLORS.primary,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  fileCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  fileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  fileIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fileInfo: {
    flex: 1,
  },
  fileTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  fileName: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 2,
  },
  fileSize: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },
  fileActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 8,
    gap: 4,
  },
  playButton: {
    backgroundColor: COLORS.success,
  },
  playingButton: {
    backgroundColor: COLORS.warning,
  },
  replaceButton: {
    backgroundColor: COLORS.primary,
  },
  deleteButton: {
    backgroundColor: COLORS.error,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 8,
  },
  addButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
});