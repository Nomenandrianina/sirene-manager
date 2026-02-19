export const API_CONFIG = {
    BASE_URL: 'http://192.168.4.1', // IP par défaut du hotspot ESP32
    TIMEOUT: 10000,
    ENDPOINTS: {
      AUTH: '/api/auth',
      STATUS: '/api/status',
      UPLOAD: '/api/upload',
      TEST_PLAY: '/api/test',
      SETTINGS: '/api/settings',
    }
  };
  
  export const WIFI_CONFIG = {
    SSID_PREFIX: 'SIRENE_ESP32', // Préfixe du nom WiFi de l'ESP32
    PASSWORD_MIN_LENGTH: 8,
  };
  
  export const FILE_CONFIG = {
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: ['audio/mpeg', 'audio/mp3'],
  };
  
  export const COLORS = {
    primary: '#2196F3',
    success: '#4CAF50',
    error: '#F44336',
    warning: '#FF9800',  
    background: '#F5F5F5',
    text: '#212121',
    textLight: '#757575',
  };