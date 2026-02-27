// services/esp32Api.js
// Service de communication avec l'ESP32 via WiFi hotspot
// IP par défaut du hotspot ESP32 : 192.168.4.1

const ESP32_BASE_URL = 'http://192.168.4.1';
const TIMEOUT_MS = 8000;

// Helper : fetch avec timeout
const fetchWithTimeout = (url, options = {}) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timer));
};

// ─────────────────────────────────────────────
// GET /files  →  liste tous les .mp3
// Réponse attendue : { "files": [ { "name": "cyclone.mp3", "size": 102400 }, ... ] }
// ─────────────────────────────────────────────
export const getAudioFiles = async () => {
  try {
    const response = await fetchWithTimeout(`${ESP32_BASE_URL}/files`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return { success: true, files: data.files || [] };
  } catch (error) {
    if (error.name === 'AbortError') {
      return { success: false, error: 'Timeout : impossible de joindre la sirène' };
    }
    return { success: false, error: error.message };
  }
};

// ─────────────────────────────────────────────
// GET /files/{nom}  →  stream audio pour précoute
// Retourne l'URL directe utilisable par expo-av
// ─────────────────────────────────────────────
export const getAudioStreamUrl = (filename) => {
  return `${ESP32_BASE_URL}/files/${encodeURIComponent(filename)}`;
};

// ─────────────────────────────────────────────
// POST /upload  →  uploader un nouveau .mp3
// Envoie un multipart/form-data avec le fichier
// ─────────────────────────────────────────────
export const uploadAudioFile = async (fileUri, fileName) => {
  try {
    const formData = new FormData();
    formData.append('file', {
      uri: fileUri,
      name: fileName,
      type: 'audio/mpeg',
    });

    const response = await fetchWithTimeout(`${ESP32_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return { success: true };
  } catch (error) {
    if (error.name === 'AbortError') {
      return { success: false, error: 'Timeout : upload trop long ou connexion perdue' };
    }
    return { success: false, error: error.message };
  }
};

// ─────────────────────────────────────────────
// PATCH /files/{nom}  →  renommer un fichier
// Body : { "newName": "nouveau_nom.mp3" }
// ─────────────────────────────────────────────
export const renameAudioFile = async (oldName, newName) => {
  try {
    // S'assurer que le nouveau nom a l'extension .mp3
    const finalName = newName.endsWith('.mp3') ? newName : `${newName}.mp3`;

    const response = await fetchWithTimeout(
      `${ESP32_BASE_URL}/files/${encodeURIComponent(oldName)}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newName: finalName }),
      }
    );

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return { success: true, newName: finalName };
  } catch (error) {
    if (error.name === 'AbortError') {
      return { success: false, error: 'Timeout : impossible de joindre la sirène' };
    }
    return { success: false, error: error.message };
  }
};

// ─────────────────────────────────────────────
// DELETE /files/{nom}  →  supprimer un fichier
// ─────────────────────────────────────────────
export const deleteAudioFile = async (filename) => {
  try {
    const response = await fetchWithTimeout(
      `${ESP32_BASE_URL}/files/${encodeURIComponent(filename)}`,
      { method: 'DELETE' }
    );

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return { success: true };
  } catch (error) {
    if (error.name === 'AbortError') {
      return { success: false, error: 'Timeout : impossible de joindre la sirène' };
    }
    return { success: false, error: error.message };
  }
};

// ─────────────────────────────────────────────
// Vérifier que l'ESP32 est joignable
// ─────────────────────────────────────────────
export const pingESP32 = async () => {
  try {
    const response = await fetchWithTimeout(`${ESP32_BASE_URL}/ping`);
    return response.ok;
  } catch {
    return false;
  }
};
