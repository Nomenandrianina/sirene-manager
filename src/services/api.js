import axios from 'axios';
import { API_CONFIG } from '../utils/constants';
import { mockServer } from './mockServer';

const USE_MOCK = true;

const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
});

let authToken = null;

export const setAuthToken = (token) => {
  authToken = token;
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

export const apiService = {
  authenticate: async (code) => {
    if (USE_MOCK) return await mockServer.authenticate(code);
    const response = await api.post(API_CONFIG.ENDPOINTS.AUTH, { code });
    return response.data;
  },

  getStatus: async () => {
    if (USE_MOCK) return await mockServer.getStatus();
    const response = await api.get(API_CONFIG.ENDPOINTS.STATUS);
    return response.data;
  },

  // NOUVEAU : Récupérer la liste des fichiers
  getFiles: async () => {
    if (USE_MOCK) return await mockServer.getFiles();
    const response = await api.get('/api/files');
    return response.data;
  },

  // MODIFIÉ : Upload avec titre
  uploadMP3: async (file, title, onProgress) => {
    if (USE_MOCK) return await mockServer.uploadMP3(file, title, onProgress);
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      type: 'audio/mpeg',
      name: file.name || 'audio.mp3',
    });
    formData.append('title', title);
    const response = await api.post('/api/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        const percent = Math.round((e.loaded * 100) / e.total);
        onProgress && onProgress(percent);
      },
    });
    return response.data;
  },

  // NOUVEAU : Supprimer un fichier
  deleteFile: async (fileId) => {
    if (USE_MOCK) return await mockServer.deleteFile(fileId);
    const response = await api.delete(`/api/files/${fileId}`);
    return response.data;
  },

  // MODIFIÉ : Tester la lecture d'un fichier spécifique
  testPlay: async (fileId) => {
    if (USE_MOCK) return await mockServer.testPlay(fileId);
    const response = await api.post(`/api/test/${fileId}`);
    return response.data;
  },

  changePassword: async (newPassword) => {
    if (USE_MOCK) return await mockServer.changePassword(newPassword);
    const response = await api.post('/api/settings', {
      action: 'change_password',
      password: newPassword,
    });
    return response.data;
  },
};

export default api;