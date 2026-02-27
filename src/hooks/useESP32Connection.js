// hooks/useESP32Connection.js
// Surveille en continu si le téléphone est toujours connecté au hotspot ESP32
// Vérifie deux choses :
//   1. Le téléphone est sur WiFi
//   2. L'ESP32 répond bien (ping)

import NetInfo from '@react-native-community/netinfo';
import { useCallback, useEffect, useRef, useState } from 'react';
import { pingESP32 } from '../services/esp32api';

const PING_INTERVAL_MS = 5000; // vérifier toutes les 5 secondes

export const useESP32Connection = () => {
  const [isConnected, setIsConnected]   = useState(true);
  const [isChecking, setIsChecking]     = useState(false);
  const pingIntervalRef                 = useRef(null);
  const isMountedRef                    = useRef(true);

  const checkConnection = useCallback(async () => {
    if (!isMountedRef.current) return;

    // 1. Vérifier d'abord si on est sur WiFi
    const netState = await NetInfo.fetch();
    if (!netState.isConnected || netState.type !== 'wifi') {
      if (isMountedRef.current) setIsConnected(false);
      return;
    }

    // 2. Vérifier que l'ESP32 répond
    const alive = await pingESP32();
    if (isMountedRef.current) setIsConnected(alive);
  }, []);

  const startMonitoring = useCallback(() => {
    // Vérification immédiate
    checkConnection();

    // Puis toutes les 5 secondes
    pingIntervalRef.current = setInterval(checkConnection, PING_INTERVAL_MS);
  }, [checkConnection]);

  const stopMonitoring = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    // Écouter aussi les changements réseau immédiats (WiFi coupé, avion mode...)
    const unsubscribe = NetInfo.addEventListener(state => {
      if (!state.isConnected || state.type !== 'wifi') {
        if (isMountedRef.current) setIsConnected(false);
      } else {
        // Wifi revenu → re-vérifier l'ESP32
        checkConnection();
      }
    });

    startMonitoring();

    return () => {
      isMountedRef.current = false;
      stopMonitoring();
      unsubscribe();
    };
  }, [startMonitoring, stopMonitoring, checkConnection]);

  return { isConnected, isChecking, recheckNow: checkConnection };
};
