// Mock API service simulating ESP32 REST API responses

export interface DeviceStatus {
  connected: boolean;
  batteryLevel: number;
  firmwareVersion: string;
  model: string;
  ipAddress: string;
  macAddress: string;
}

export interface Mp3File {
  name: string;
  size: number; // in bytes
  duration: number; // in seconds
}

export interface DeviceInfo {
  status: DeviceStatus;
  currentMp3: Mp3File | null;
}

// Simulated device state
let deviceState: DeviceInfo = {
  status: {
    connected: true,
    batteryLevel: 78,
    firmwareVersion: "2.1.3",
    model: "ESP32-SIRENE-V2",
    ipAddress: "192.168.4.1",
    macAddress: "AA:BB:CC:DD:EE:FF",
  },
  currentMp3: {
    name: "alarme_incendie.mp3",
    size: 2_450_000,
    duration: 45,
  },
};

let wifiPassword = "sirene2024";
let authCode = "123456";
let isAuthenticated = false;
let isWifiConnected = false;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const mockApi = {
  // WiFi
  async connectWifi(password: string): Promise<{ success: boolean; message: string }> {
    await delay(1500);
    if (password === wifiPassword) {
      isWifiConnected = true;
      return { success: true, message: "Connecté au hotspot ESP32" };
    }
    return { success: false, message: "Mot de passe incorrect" };
  },

  async getWifiStatus(): Promise<{ connected: boolean }> {
    await delay(300);
    return { connected: isWifiConnected };
  },

  // Auth
  async authenticate(code: string): Promise<{ success: boolean; message: string }> {
    await delay(1000);
    if (code === authCode) {
      isAuthenticated = true;
      return { success: true, message: "Authentification réussie" };
    }
    return { success: false, message: "Code invalide" };
  },

  async isAuthenticated(): Promise<boolean> {
    return isAuthenticated;
  },

  // Device
  async getDeviceInfo(): Promise<DeviceInfo> {
    await delay(500);
    return { ...deviceState };
  },

  // MP3 Upload
  async uploadMp3(
    file: File,
    onProgress: (progress: number) => void
  ): Promise<{ success: boolean; message: string }> {
    if (!file.name.endsWith(".mp3")) {
      return { success: false, message: "Format invalide. Seuls les fichiers MP3 sont acceptés." };
    }
    if (file.size > 5 * 1024 * 1024) {
      return { success: false, message: "Fichier trop volumineux (max 5 MB)." };
    }

    // Simulate upload progress
    for (let i = 0; i <= 100; i += 10) {
      await delay(300);
      onProgress(i);
    }

    deviceState.currentMp3 = {
      name: file.name,
      size: file.size,
      duration: Math.floor(Math.random() * 120) + 10,
    };

    return { success: true, message: "Fichier uploadé avec succès" };
  },

  // Audio playback
  async testPlayback(): Promise<{ success: boolean; duration: number }> {
    await delay(500);
    return { success: true, duration: deviceState.currentMp3?.duration || 0 };
  },

  async stopPlayback(): Promise<{ success: boolean }> {
    await delay(300);
    return { success: true };
  },

  // Settings
  async changeWifiPassword(
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    await delay(1000);
    if (currentPassword === wifiPassword) {
      wifiPassword = newPassword;
      return { success: true, message: "Mot de passe WiFi modifié" };
    }
    return { success: false, message: "Mot de passe actuel incorrect" };
  },

  async changeAuthCode(
    currentCode: string,
    newCode: string
  ): Promise<{ success: boolean; message: string }> {
    await delay(1000);
    if (currentCode === authCode) {
      authCode = newCode;
      return { success: true, message: "Code d'authentification modifié" };
    }
    return { success: false, message: "Code actuel incorrect" };
  },

  async logout(): Promise<void> {
    await delay(300);
    isAuthenticated = false;
    isWifiConnected = false;
  },
};
