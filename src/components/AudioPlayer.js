import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, StyleSheet, Text, TouchableOpacity, View, } from 'react-native';
import { COLORS } from '../utils/constants';

export default function AudioPlayer({ visible, file, onClose }) {
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (visible && file) {
      setupAudio();
    }
    return () => {
      // Nettoyer le son quand on ferme
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [visible, file]);

  const setupAudio = async () => {
    try {
      // Configurer l'audio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });
    } catch (error) {
      console.error('Erreur configuration audio:', error);
    }
  };

  const handlePlayPause = async () => {
    try {
      if (!file?.uri) {
        // En mode simulation : pas de vrai fichier URI
        Alert.alert(
          '🔊 Simulation',
          `En mode réel, l\'ESP32 jouerait le fichier "${file?.filename}" directement sur ses haut-parleurs.\n\nConnectez-vous à un vrai ESP32 pour tester la lecture réelle.`
        );
        return;
      }

      if (sound) {
        // Si le son existe déjà
        if (isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
        } else {
          await sound.playAsync();
          setIsPlaying(true);
        }
      } else {
        // Charger et jouer le son
        setIsLoading(true);
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: file.uri },
          { shouldPlay: true },
          onPlaybackStatusUpdate
        );
        setSound(newSound);
        setIsPlaying(true);
        setIsLoading(false);
      }
    } catch (error) {
      setIsLoading(false);
      Alert.alert('Erreur', 'Impossible de lire ce fichier audio.');
      console.error('Erreur lecture:', error);
    }
  };

  const onPlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      setPosition(status.positionMillis || 0);
      setDuration(status.durationMillis || 0);
      setIsPlaying(status.isPlaying);
      
      // Fin de lecture
      if (status.didJustFinish) {
        setIsPlaying(false);
        setPosition(0);
      }
    }
  };

  const handleStop = async () => {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
    }
    setIsPlaying(false);
    setPosition(0);
  };

  const handleClose = async () => {
    await handleStop();
    onClose();
  };

  const formatTime = (millis) => {
    if (!millis) return '0:00';
    const seconds = Math.floor(millis / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.playerContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>🔊 Lecture audio</Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          {/* Infos du fichier */}
          <View style={styles.fileInfoContainer}>
            <View style={styles.albumArt}>
              <Ionicons name="musical-notes" size={48} color={COLORS.primary} />
            </View>
            <Text style={styles.fileTitle}>{file?.title || 'Audio'}</Text>
            <Text style={styles.fileName}>{file?.filename || ''}</Text>
          </View>

          {/* Barre de progression */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progressPercent}%` }
                ]}
              />
            </View>
            <View style={styles.timeContainer}>
              <Text style={styles.timeText}>{formatTime(position)}</Text>
              <Text style={styles.timeText}>{formatTime(duration)}</Text>
            </View>
          </View>

          {/* Contrôles */}
          <View style={styles.controls}>
            {/* Stop */}
            <TouchableOpacity
              style={styles.controlButton}
              onPress={handleStop}
            >
              <Ionicons name="stop" size={28} color={COLORS.textLight} />
            </TouchableOpacity>

            {/* Play / Pause */}
            <TouchableOpacity
              style={styles.playPauseButton}
              onPress={handlePlayPause}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="large" />
              ) : (
                <Ionicons
                  name={isPlaying ? 'pause' : 'play'}
                  size={40}
                  color="#fff"
                />
              )}
            </TouchableOpacity>

            {/* Fermer */}
            <TouchableOpacity
              style={styles.controlButton}
              onPress={handleClose}
            >
              <Ionicons name="close-circle" size={28} color={COLORS.textLight} />
            </TouchableOpacity>
          </View>

          {/* Note simulation */}
          {!file?.uri && (
            <View style={styles.simulationNote}>
              <Ionicons name="information-circle" size={16} color={COLORS.primary} />
              <Text style={styles.simulationText}>
                Mode simulation : L'ESP32 joue le son sur ses propres haut-parleurs
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  playerContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  fileInfoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  albumArt: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  fileTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  fileName: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 4,
  },
  progressContainer: {
    marginBottom: 32,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
    marginBottom: 24,
  },
  controlButton: {
    padding: 8,
  },
  playPauseButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  simulationNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  simulationText: {
    fontSize: 12,
    color: COLORS.primary,
    flex: 1,
  },
});